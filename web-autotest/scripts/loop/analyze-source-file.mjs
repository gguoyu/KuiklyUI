#!/usr/bin/env node
/**
 * analyze-source-file.mjs
 *
 * Statically analyzes a Kotlin source file from core-render-web and extracts
 * testable behaviors: props, events, module methods, state transitions, and
 * inferred source type / category.
 *
 * Usage:
 *   node web-autotest/scripts/loop/analyze-source-file.mjs <path-to-kt-file>
 *
 * Output: JSON to stdout
 */

import { readFileSync, existsSync } from 'fs';
import { basename, relative } from 'path';
import { repoRoot } from '../lib/paths.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSource(filePath) {
  if (!existsSync(filePath)) {
    console.error(JSON.stringify({ error: `File not found: ${filePath}` }));
    process.exit(1);
  }
  return readFileSync(filePath, 'utf8');
}

/**
 * Extract all string literals from a when-branch block.
 * Handles both quoted strings and KRXxxConst.SOME_KEY references.
 * Returns the raw string values only (not the const names).
 */
function extractWhenBranchStrings(source) {
  const results = new Set();

  // Direct quoted strings in when blocks: "someKey" ->
  const quotedPattern = /"([a-zA-Z][a-zA-Z0-9_\-./]*?)"\s*->/g;
  let m;
  while ((m = quotedPattern.exec(source)) !== null) {
    results.add(m[1]);
  }

  return [...results];
}

/**
 * Extract constant values from companion object / top-level const definitions.
 * e.g.  const val SOME_KEY = "someKey"  →  { SOME_KEY: "someKey" }
 */
function extractConstMap(source) {
  const constMap = {};
  const pattern = /const\s+val\s+([A-Z_][A-Z0-9_]*)\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = pattern.exec(source)) !== null) {
    constMap[m[1]] = m[2];
  }
  return constMap;
}

/**
 * Resolve a const reference (e.g. KRCssConst.BACKGROUND_COLOR) to its string value
 * using the constMap built from the file itself plus a built-in fallback map of
 * the most common KRCssConst / KREventConst values observed in the codebase.
 */
const BUILTIN_CONST_MAP = {
  // KRCssConst (CSS props)
  BACKGROUND_COLOR: 'backgroundColor',
  BORDER_RADIUS: 'borderRadius',
  BORDER: 'border',
  OPACITY: 'opacity',
  TRANSFORM: 'transform',
  SHADOW: 'boxShadow',
  FRAME: 'frame',
  OVERFLOW: 'overflow',
  Z_INDEX: 'zIndex',
  VISIBILITY: 'visibility',
  PADDING: 'padding',
  MARGIN: 'margin',
  FLEX: 'flex',
  FLEX_DIRECTION: 'flexDirection',
  JUSTIFY_CONTENT: 'justifyContent',
  ALIGN_ITEMS: 'alignItems',
  // KRCssConst (touch / gesture)
  PAN: 'pan',
  SUPER_TOUCH: 'superTouch',
  TOUCH_DOWN: 'touchDown',
  TOUCH_MOVE: 'touchMove',
  TOUCH_UP: 'touchUp',
  TOUCH_CANCEL: 'touchCancel',
  CLICK: 'click',
  LONG_PRESS: 'longPress',
  DOUBLE_CLICK: 'doubleClick',
  ANIMATION: 'animation',
  TRANSITION: 'transition',
  SCROLL_ENABLE: 'scrollEnable',
  // KREventConst
  SCROLL: 'scroll',
  SCROLL_TO_TOP: 'scrollToTop',
  ON_LOAD_SUCCESS: 'onLoadSuccess',
  ON_LOAD_FAILURE: 'onLoadFailure',
  // KRImageView specific
  SRC: 'src',
  RESIZE: 'resize',
  TINT_COLOR: 'tintColor',
  BLUR_RADIUS: 'blurRadius',
  // KRRichTextView
  VALUES: 'values',
  TEXT: 'text',
  FONT_SIZE: 'fontSize',
  // Module methods (KRNotifyModule)
  METHOD_ADD_NOTIFY: 'addNotify',
  METHOD_REMOVE_NOTIFY: 'removeNotify',
  METHOD_POST_NOTIFY: 'postNotify',
};

function resolveConstRef(ref, localConstMap) {
  // Strip class prefix: KRCssConst.BACKGROUND_COLOR → BACKGROUND_COLOR
  const key = ref.includes('.') ? ref.split('.').pop() : ref;
  return localConstMap[key] || BUILTIN_CONST_MAP[key] || null;
}

/**
 * Extract prop keys from setProp / when(propKey) blocks.
 * Handles both literal strings and const references.
 */
function extractProps(source, localConstMap) {
  const props = new Set();

  // Quoted string in when branch
  const quotedWhen = /"([a-zA-Z][a-zA-Z0-9_\-.]*?)"\s*->/g;
  let m;
  while ((m = quotedWhen.exec(source)) !== null) {
    props.add(m[1]);
  }

  // Const reference in when branch: KRCssConst.BACKGROUND_COLOR ->
  const constRef = /([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Z0-9_]*)?)\s*->/g;
  while ((m = constRef.exec(source)) !== null) {
    const resolved = resolveConstRef(m[1], localConstMap);
    if (resolved) props.add(resolved);
  }

  return [...props].filter(isLikelyCssProp);
}

/**
 * Extract event types from the source.
 * Looks for patterns like:  KRCssConst.CLICK ->  or  "click" ->
 * and also explicit event handler registrations.
 */
function extractEvents(source, localConstMap) {
  const events = new Set();
  const eventKeywords = [
    'click', 'longPress', 'doubleClick', 'pan',
    'touchDown', 'touchMove', 'touchUp', 'touchCancel',
    'scroll', 'scrollToTop',
  ];

  for (const kw of eventKeywords) {
    if (source.includes(`"${kw}"`) || source.includes(kw + ' ->') || source.includes(kw + '->')) {
      events.add(kw);
    }
  }

  // Also check const refs
  const constRef = /([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Z0-9_]*)?)\s*->/g;
  let m;
  while ((m = constRef.exec(source)) !== null) {
    const resolved = resolveConstRef(m[1], localConstMap);
    if (resolved && eventKeywords.includes(resolved)) {
      events.add(resolved);
    }
  }

  return [...events];
}

/**
 * Extract module method names from override fun call(method, ...) { when (method) { ... } }
 */
function extractModuleMethods(source, localConstMap) {
  const methods = new Set();

  // Find the call() override body
  const callMatch = source.match(/override\s+fun\s+call\s*\([^)]*\)[^{]*\{([\s\S]*?)(?=\n\s{4}[a-zA-Z]|\n\})/);
  if (!callMatch) return [];

  const callBody = callMatch[1];

  // Quoted string in when branch
  const quotedWhen = /"([a-zA-Z][a-zA-Z0-9_]*?)"\s*->/g;
  let m;
  while ((m = quotedWhen.exec(callBody)) !== null) {
    methods.add(m[1]);
  }

  // Const references
  const constRef = /([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Z0-9_]*)?)\s*->/g;
  while ((m = constRef.exec(callBody)) !== null) {
    const resolved = resolveConstRef(m[1], localConstMap);
    if (resolved) methods.add(resolved);
  }

  return [...methods];
}

/**
 * Infer source type: component | module | layout | other
 */
function inferSourceType(source, fileName) {
  if (/\bKuiklyRenderBaseModule\b/.test(source) || /\bModule\b/.test(fileName)) {
    return 'module';
  }
  if (/\bIKuiklyRenderViewExport\b/.test(source) || /\bKRView\b/.test(source)) {
    return 'component';
  }
  if (/\bIListElement\b/.test(source) || /ListView/.test(fileName)) {
    return 'component';
  }
  return 'other';
}

/**
 * Infer web_test category from source type, file name, and extracted behaviors.
 */
function inferCategory(sourceType, fileName, events, props) {
  if (sourceType === 'module') return 'modules';

  const name = fileName.toLowerCase();

  if (/list|scroll/.test(name)) return 'interactions';
  if (/anim|transition/.test(name)) return 'animations';
  if (/gesture|touch|event/.test(name)) return 'interactions';

  const hasInteractionEvents = events.some((e) =>
    ['click', 'longPress', 'doubleClick', 'pan', 'touchDown', 'touchUp'].includes(e)
  );
  if (hasInteractionEvents) return 'interactions';

  return 'components';
}

/**
 * Classify each extracted prop as a CSS visual prop vs an event/behavior prop.
 */
function isLikelyCssProp(prop) {
  // Exclude internal/noise values
  const noise = [
    'true', 'false', 'null', 'undefined', 'auto', 'none',
    'normal', 'hidden', 'visible', 'scroll',
  ];
  if (noise.includes(prop)) return false;
  if (prop.length < 2 || prop.length > 40) return false;
  // Must start with lowercase letter (CSS prop naming convention)
  if (!/^[a-z]/.test(prop)) return false;
  return true;
}

/**
 * Infer state transitions from observable state + conditional text patterns.
 * Returns pairs of { before, after } when detectable.
 *
 * Handles:
 *   text(if (ctx.x) "A" else "B")
 *   text(if (ctx.x == 0) "A" else if (ctx.x == 1) "B" else "C")  → (A→B, B→C)
 *   titleAttr { text(if ...) }
 *   text("${if (ctx.x) "A" else "B"}")  (template literal form — rare)
 */
function inferStateTransitions(source) {
  const transitions = [];
  const seen = new Set();

  function addPair(before, after) {
    const key = `${before}|||${after}`;
    if (!seen.has(key) && before !== after && before.length > 0 && after.length > 0) {
      seen.add(key);
      transitions.push({ before, after });
    }
  }

  // Pattern 1: simple binary  text(if (...) "A" else "B")
  const binaryPattern = /text\s*\(\s*if\s*\([^)]{0,200}\)\s*"([^"]{1,60})"\s*else\s*"([^"]{1,60})"\s*\)/g;
  let m;
  while ((m = binaryPattern.exec(source)) !== null) {
    addPair(m[1], m[2]);
  }

  // Pattern 2: chained ternary  if (...) "A" else if (...) "B" else "C"
  // Extract all quoted strings that appear within a single text(...) call that contains "if"
  const textCallPattern = /text\s*\(\s*(if\s*\([\s\S]{0,600}?)\)/g;
  while ((m = textCallPattern.exec(source)) !== null) {
    const callBody = m[1];
    const labels = [];
    const labelPattern = /"([^"]{1,60})"/g;
    let lm;
    while ((lm = labelPattern.exec(callBody)) !== null) {
      labels.push(lm[1]);
    }
    // Each consecutive pair is a before→after transition
    for (let i = 0; i < labels.length - 1; i++) {
      addPair(labels[i], labels[i + 1]);
    }
  }

  // Pattern 3: titleAttr { text(...) } — same as above but nested
  const titleAttrPattern = /titleAttr\s*\{[\s\S]{0,200}?text\s*\(\s*(if\s*\([\s\S]{0,400}?)\)\s*\}/g;
  while ((m = titleAttrPattern.exec(source)) !== null) {
    const callBody = m[1];
    const labels = [];
    const labelPattern = /"([^"]{1,60})"/g;
    let lm;
    while ((lm = labelPattern.exec(callBody)) !== null) {
      labels.push(lm[1]);
    }
    for (let i = 0; i < labels.length - 1; i++) {
      addPair(labels[i], labels[i + 1]);
    }
  }

  // Pattern 4: module result text  text("count:${ctx.x}")  or  text("result: ${ctx.y}")
  // These are detectable as stable prefix patterns
  const templatePattern = /text\s*\(\s*"([a-zA-Z][a-zA-Z0-9 _\-:]+)\$\{[^}]{1,40}\}"\s*\)/g;
  while ((m = templatePattern.exec(source)) !== null) {
    // Record the prefix so generate-carrier-page can use it as a result oracle prefix
    transitions.push({ type: 'template-prefix', prefix: m[1] });
  }

  // Pattern 5: template string containing if  text("prefix ${if (ctx.x) "A" else "B"}")
  const templateIfPattern = /text\s*\(\s*"[^"]*\$\{\s*if\s*\([^)]{0,200}\)\s*"([^"]{1,60})"\s*else\s*"([^"]{1,60})"\s*\}[^"]*"\s*\)/g;
  while ((m = templateIfPattern.exec(source)) !== null) {
    addPair(m[1], m[2]);
  }

  return transitions;
}

/**
 * Suggest actionScripts entries for interaction-protocol.json pageProfiles.
 * Based on detected state transitions (before/after text pairs).
 */
function suggestActionScripts(stateTransitions) {
  const scriptable = stateTransitions.filter((t) => t.before && t.after);
  if (!scriptable.length) return [];

  // Detect long-press patterns: labels containing "长按" / "press" → kind: long-press
  return scriptable.slice(0, 6).map(({ before, after }) => ({
    kind: /长按|press.and.hold|long.press/i.test(before) ? 'long-press' : 'click',
    targetLabel: before,
    expectLabel: after,
  }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const filePath = process.argv[2];
if (!filePath) {
  console.error(JSON.stringify({ error: 'Usage: node analyze-source-file.mjs <path-to-kt-file>' }));
  process.exit(1);
}

const source = readSource(filePath);
const fileName = basename(filePath, '.kt');
const relativeFile = relative(repoRoot, filePath).replace(/\\/g, '/');

const localConstMap = extractConstMap(source);
const sourceType = inferSourceType(source, fileName);
const props = extractProps(source, localConstMap);
const events = extractEvents(source, localConstMap);
const moduleMethods = sourceType === 'module' ? extractModuleMethods(source, localConstMap) : [];
const stateTransitions = inferStateTransitions(source);
const suggestedActionScripts = suggestActionScripts(stateTransitions);
const suggestedCategory = inferCategory(sourceType, fileName, events, props);

// Determine if we have enough info to generate a useful test page
const hasStableOracle = stateTransitions.some((t) => t.before || t.prefix) || moduleMethods.length > 0;
const hasActionPath = events.some((e) => ['click', 'longPress', 'doubleClick'].includes(e))
  || moduleMethods.length > 0
  || stateTransitions.some((t) => t.before);
const testabilityPassed = hasStableOracle && hasActionPath;

const result = {
  generatedAt: new Date().toISOString(),
  file: relativeFile,
  fileName,
  sourceType,
  suggestedCategory,
  props,
  events,
  moduleMethods,
  stateTransitions,
  suggestedActionScripts,
  testability: {
    passed: testabilityPassed,
    hasStableOracle,
    hasActionPath,
    reason: !testabilityPassed
      ? (!hasStableOracle
          ? 'No state transitions detected — cannot generate meaningful assertions without knowing before/after text'
          : 'No usable action path detected — no click/longPress/module method found')
      : 'OK',
  },
};

console.log(JSON.stringify(result, null, 2));
