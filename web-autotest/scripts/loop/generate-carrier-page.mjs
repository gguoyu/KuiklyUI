#!/usr/bin/env node
/**
 * generate-carrier-page.mjs
 *
 * Generates a Kotlin web_test carrier page from an analyze-source-file.mjs result.
 * Also updates rules/interaction-protocol.json with the new page's actionScripts (B3).
 *
 * Usage:
 *   node web-autotest/scripts/loop/generate-carrier-page.mjs <path-to-kt-source-file> [--dry-run] [--write]
 *
 *   --dry-run   Print the generated Kotlin code without writing files (default)
 *   --write     Write the Kotlin file to webTestRoot and update interaction-protocol.json
 *
 * Output: JSON to stdout with { kotlinFile, kotlinCode, pageProfileEntry, written }
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { basename, dirname, join, relative } from 'path';
import { createRequire } from 'module';
import { repoRoot, webTestRoot } from '../lib/paths.mjs';
import { toPosix } from '../lib/fs-utils.mjs';
import { runScriptJson } from '../lib/script-runner.mjs';

const require = createRequire(import.meta.url);
const autotestConfig = require(join(repoRoot, 'web-autotest', 'kuikly.autotest.config.cjs'));
const INTERACTION_PROTOCOL_PATH = join(repoRoot, 'web-autotest', 'rules', 'interaction-protocol.json');

const args = process.argv.slice(2);
const sourceFilePath = args.find((a) => !a.startsWith('--'));
const dryRun = !args.includes('--write');

if (!sourceFilePath) {
  console.error(JSON.stringify({ error: 'Usage: generate-carrier-page.mjs <source-kt-file> [--write]' }));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 1: Run analyze-source-file to get behaviors
// ---------------------------------------------------------------------------

const analyzerScript = join(repoRoot, 'web-autotest', 'scripts', 'loop', 'analyze-source-file.mjs');
let analysis;
try {
  analysis = runScriptJson(analyzerScript, sourceFilePath);
} catch (err) {
  console.error(JSON.stringify({ error: `analyze-source-file failed: ${err.message}` }));
  process.exit(1);
}

const {
  fileName,
  suggestedCategory,
  props,
  events,
  moduleMethods,
  stateTransitions,
  suggestedActionScripts,
  testability,
} = analysis;

const pageName = suggestPageName(fileName, suggestedCategory);
const packageSuffix = suggestedCategory;
const packageName = `${autotestConfig.webTestPackagePrefix}.${packageSuffix}`;
const outputPath = join(webTestRoot, packageSuffix, `${pageName}.kt`);

// ---------------------------------------------------------------------------
// Step 2: Generate Kotlin code
// ---------------------------------------------------------------------------

function suggestPageName(srcName, category) {
  // Don't double-add TestPage suffix
  if (/TestPage$/i.test(srcName)) return srcName;
  if (category === 'modules' || /Module$/.test(srcName)) {
    return srcName.replace(/^KR/, '') + 'TestPage';
  }
  return srcName + 'TestPage';
}

function generateImports(category, hasObservable, usesButton, usesImage, usesScroller) {
  const lines = [
    'import com.tencent.kuikly.core.annotations.Page',
    'import com.tencent.kuikly.core.base.Color',
    'import com.tencent.kuikly.core.base.ViewBuilder',
    'import com.tencent.kuikly.core.pager.Pager',
  ];

  if (hasObservable) {
    lines.push('import com.tencent.kuikly.core.reactive.handler.observable');
  }

  lines.push('import com.tencent.kuikly.core.views.List');
  lines.push('import com.tencent.kuikly.core.views.Text');
  lines.push('import com.tencent.kuikly.core.views.View');

  if (usesButton) {
    lines.push('import com.tencent.kuikly.core.views.compose.Button');
  }
  if (usesImage) {
    lines.push('import com.tencent.kuikly.core.views.Image');
  }
  if (usesScroller) {
    lines.push('import com.tencent.kuikly.core.views.Scroller');
  }
  if (category === 'modules') {
    lines.push('import com.tencent.kuikly.core.nvi.serialization.json.JSONObject');
  }

  return lines.sort().join('\n');
}

function sectionHeader(n, title) {
  return `                // === Section ${n}: ${title} ===
                Text {
                    attr {
                        text("${n}. ${title}")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(${n === 1 ? '16' : '24'}f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }`;
}

function stateButton(stateVar, beforeLabel, afterLabel, eventType, marginTop = 12) {
  const eventBlock = eventType === 'longPress'
    ? `                    event { longPress { ctx.${stateVar} = !ctx.${stateVar} } }`
    : `                    event { click { ctx.${stateVar} = !ctx.${stateVar} } }`;

  return `                View {
                    attr {
                        margin(left = 16f, right = 16f, top = ${marginTop}f)
                        height(52f)
                        backgroundColor(if (ctx.${stateVar}) Color(0xFF4CAF50) else Color(0xFF2196F3))
                        borderRadius(8f)
                        allCenter()
                    }
${eventBlock}
                    Text {
                        attr {
                            text(if (ctx.${stateVar}) "${afterLabel}" else "${beforeLabel}")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }`;
}

function moduleActionButton(label, moduleName, methodName, stateVar) {
  return `                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(52f)
                        backgroundColor(Color(0xFF1E88E5))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.${stateVar} += 1
                        }
                    }
                    Text {
                        attr {
                            text("${label}")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }
                Text {
                    attr {
                        text("${label}-result:\${ctx.${stateVar}}")
                        fontSize(14f)
                        marginTop(8f)
                        marginLeft(16f)
                        color(Color(0xFF1565C0))
                    }
                }`;
}

// ---------------------------------------------------------------------------
// Template generators by category
// ---------------------------------------------------------------------------

function generateInteractionsPage(pageName, packageName, fileName, stateTransitions, events, props) {
  const hasPairs = stateTransitions.filter((t) => t.before && t.after).length > 0;

  // Build sections from state transitions, fall back to generic click/longPress
  const sections = [];
  const stateVars = [];

  if (hasPairs) {
    // Group consecutive pairs into sections (max 4)
    const pairs = stateTransitions.filter((t) => t.before && t.after).slice(0, 4);
    pairs.forEach((pair, i) => {
      const varName = `state${i + 1}`;
      stateVars.push({ name: varName, type: 'Boolean', initial: 'false' });
      const eventType = pair.kind === 'long-press' || /长按|press.and.hold/i.test(pair.before) ? 'longPress' : 'click';
      const title = i === 0 ? `${fileName} 基础交互` : `${fileName} 交互 ${i + 1}`;
      sections.push(`
${sectionHeader(i + 1, title)}

${stateButton(varName, pair.before, pair.after, eventType)}`);
    });
  } else {
    // Generic fallback: click toggle
    stateVars.push({ name: 'activated', type: 'Boolean', initial: 'false' });
    sections.push(`
${sectionHeader(1, `${fileName} 点击交互`)}

${stateButton('activated', '点击激活', '已激活', 'click')}`);

    if (events.includes('longPress')) {
      stateVars.push({ name: 'longPressed', type: 'Boolean', initial: 'false' });
      sections.push(`
${sectionHeader(2, `${fileName} 长按交互`)}

${stateButton('longPressed', '长按此区域', '长按已激活', 'longPress')}`);
    }
  }

  const observableDecls = stateVars
    .map((v) => `    private var ${v.name} by observable(${v.initial})`)
    .join('\n');

  const hasObservable = stateVars.length > 0;
  const imports = generateImports(suggestedCategory, hasObservable, false, false, false);

  return `package ${packageName}

${imports}

/**
 * ${fileName} interaction test page
 *
 * Tests covered:
${sections.map((_, i) => ` * ${i + 1}. ${i === 0 ? `${fileName} basic interaction` : `${fileName} interaction ${i + 1}`}`).join('\n')}
 */
@Page("${pageName}")
internal class ${pageName} : Pager() {

${observableDecls}

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }
${sections.join('\n')}

                // Bottom spacing
                View { attr { height(50f) } }
            }
        }
    }
}
`;
}

function generateComponentsPage(pageName, packageName, fileName, props) {
  // Generate one section per meaningful visual prop (max 6)
  const visualProps = props.filter((p) => isVisualProp(p)).slice(0, 6);
  const fallbackProps = visualProps.length > 0 ? visualProps : ['backgroundColor', 'borderRadius', 'border'];

  const sections = fallbackProps.map((prop, i) => {
    const title = propToSectionTitle(prop);
    return `
${sectionHeader(i + 1, title)}
                View {
                    attr {
                        flexDirectionRow()
                        padding(all = 16f)
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF2196F3))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("sample-1")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color(0xFF4CAF50))
                            marginLeft(12f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("sample-2")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }`;
  });

  const imports = generateImports(suggestedCategory, false, false, false, false);

  return `package ${packageName}

${imports}

/**
 * ${fileName} component render test page
 *
 * Tests covered:
${sections.map((_, i) => ` * ${i + 1}. ${propToSectionTitle(fallbackProps[i] || 'visual')}`).join('\n')}
 */
@Page("${pageName}")
internal class ${pageName} : Pager() {

    override fun body(): ViewBuilder {
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }
${sections.join('\n')}

                // Bottom spacing
                View { attr { height(50f) } }
            }
        }
    }
}
`;
}

function generateStylesPage(pageName, packageName, fileName, props) {
  const styleProps = props.filter((p) => isStyleProp(p)).slice(0, 4);
  const fallbackProps = styleProps.length > 0 ? styleProps : ['opacity'];

  const sections = fallbackProps.map((prop, i) => {
    const variants = getStyleVariants(prop);
    const title = propToSectionTitle(prop);
    const variantViews = variants.map((v) =>
      `                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(Color(0xFF1976D2))
                            ${prop}(${v.value})
                            allCenter()
                        }
                        Text { attr { text("${v.label}"); fontSize(12f); color(Color.WHITE) } }
                    }`
    ).join('\n');

    return `
${sectionHeader(i + 1, title)}
                View {
                    attr {
                        flexDirectionRow()
                        justifyContentSpaceAround()
                        padding(all = 16f)
                    }
${variantViews}
                }`;
  });

  const imports = generateImports(suggestedCategory, false, false, false, false);

  return `package ${packageName}

${imports}

/**
 * ${fileName} style render test page
 *
 * Tests covered:
${sections.map((_, i) => ` * ${i + 1}. ${propToSectionTitle(fallbackProps[i] || 'style')}`).join('\n')}
 */
@Page("${pageName}")
internal class ${pageName} : Pager() {

    override fun body(): ViewBuilder {
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }
${sections.join('\n')}

                // Bottom spacing
                View { attr { height(50f) } }
            }
        }
    }
}
`;
}

function generateModulesPage(pageName, packageName, fileName, moduleMethods, stateTransitions) {
  // Prefer stateTransitions pairs (already have targetLabel/expectLabel)
  const pairs = stateTransitions.filter((t) => t.before && t.after).slice(0, 3);
  const methods = moduleMethods.slice(0, 3);

  const sections = [];
  const stateVars = [];

  if (pairs.length > 0) {
    pairs.forEach((pair, i) => {
      const varName = `count${i + 1}`;
      stateVars.push({ name: varName, type: 'Int', initial: '0' });
      sections.push(`
${sectionHeader(i + 1, `${pair.before} 操作`)}

${moduleActionButton(pair.before, fileName, pair.before, varName)}`);
    });
  } else if (methods.length > 0) {
    methods.forEach((method, i) => {
      const varName = `result${i + 1}`;
      stateVars.push({ name: varName, type: 'Int', initial: '0' });
      sections.push(`
${sectionHeader(i + 1, `${method} 操作`)}

${moduleActionButton(method, fileName, method, varName)}`);
    });
  } else {
    // Generic module fallback
    stateVars.push({ name: 'callCount', type: 'Int', initial: '0' });
    sections.push(`
${sectionHeader(1, `${fileName} 调用`)}

${moduleActionButton('invoke', fileName, 'invoke', 'callCount')}`);
  }

  const observableDecls = stateVars
    .map((v) => `    private var ${v.name} by observable(${v.initial})`)
    .join('\n');

  const imports = generateImports(suggestedCategory, true, false, false, false);

  return `package ${packageName}

${imports}

/**
 * ${fileName} module test page
 *
 * Tests covered:
${sections.map((_, i) => ` * ${i + 1}. module method invocation ${i + 1}`).join('\n')}
 */
@Page("${pageName}")
internal class ${pageName} : Pager() {

${observableDecls}

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE); padding(20f) }

            Text {
                attr {
                    text("${pageName}")
                    fontSize(20f)
                    color(Color.BLACK)
                    marginBottom(16f)
                }
            }
${sections.join('\n')}

            // Bottom spacing
            View { attr { height(50f) } }
        }
    }
}
`;
}

function generateAnimationsPage(pageName, packageName, fileName, stateTransitions, events) {
  const pairs = stateTransitions.filter((t) => t.before && t.after).slice(0, 3);
  const stateVars = [];
  const sections = [];

  if (pairs.length > 0) {
    pairs.forEach((pair, i) => {
      const varName = `animState${i + 1}`;
      stateVars.push({ name: varName, type: 'Boolean', initial: 'false' });
      sections.push(`
${sectionHeader(i + 1, `${fileName} 动画 ${i + 1}`)}

                View {
                    attr {
                        margin(left = 16f, top = 12f)
                        size(if (ctx.${varName}) 200f else 100f, if (ctx.${varName}) 200f else 100f)
                        backgroundColor(if (ctx.${varName}) Color(0xFF4CAF50) else Color(0xFF2196F3))
                        borderRadius(8f)
                        allCenter()
                    }
                    event { click { ctx.${varName} = !ctx.${varName} } }
                    Text { attr { text("Click Me"); fontSize(14f); color(Color.WHITE); fontWeightBold() } }
                }
                Text {
                    attr {
                        text("状态: \${if (ctx.${varName}) "${pair.after}" else "${pair.before}"}")
                        fontSize(13f)
                        marginTop(8f)
                        marginLeft(16f)
                        color(Color(0xFF666666))
                    }
                }`);
    });
  } else {
    // Generic animation fallback
    stateVars.push({ name: 'isAnimated', type: 'Boolean', initial: 'false' });
    sections.push(`
${sectionHeader(1, `${fileName} 动画触发`)}

                View {
                    attr {
                        margin(left = 16f, top = 12f)
                        size(if (ctx.isAnimated) 200f else 100f, if (ctx.isAnimated) 200f else 100f)
                        backgroundColor(if (ctx.isAnimated) Color(0xFF4CAF50) else Color(0xFF2196F3))
                        borderRadius(8f)
                        allCenter()
                    }
                    event { click { ctx.isAnimated = !ctx.isAnimated } }
                    Text { attr { text("Click Me"); fontSize(14f); color(Color.WHITE); fontWeightBold() } }
                }
                Text {
                    attr {
                        text("状态: \${if (ctx.isAnimated) "已激活" else "未激活"}")
                        fontSize(13f)
                        marginTop(8f)
                        marginLeft(16f)
                        color(Color(0xFF666666))
                    }
                }`);
  }

  const observableDecls = stateVars
    .map((v) => `    private var ${v.name} by observable(${v.initial})`)
    .join('\n');

  const imports = generateImports(suggestedCategory, true, false, false, false);

  return `package ${packageName}

${imports}

/**
 * ${fileName} animation test page
 *
 * Tests covered:
${sections.map((_, i) => ` * ${i + 1}. animation scenario ${i + 1}`).join('\n')}
 */
@Page("${pageName}")
internal class ${pageName} : Pager() {

${observableDecls}

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }
${sections.join('\n')}

                // Bottom spacing
                View { attr { height(50f) } }
            }
        }
    }
}
`;
}

// ---------------------------------------------------------------------------
// Helpers for prop classification
// ---------------------------------------------------------------------------

function isVisualProp(prop) {
  return ['backgroundColor', 'borderRadius', 'border', 'opacity', 'shadow', 'transform',
    'src', 'resize', 'tintColor', 'blurRadius', 'frame', 'overflow', 'zIndex'].includes(prop);
}

function isStyleProp(prop) {
  return ['opacity', 'transform', 'shadow', 'border', 'borderRadius', 'overflow'].includes(prop);
}

function propToSectionTitle(prop) {
  const map = {
    backgroundColor: '背景色',
    borderRadius: '圆角',
    border: '边框',
    opacity: '透明度',
    shadow: '阴影',
    transform: '变换',
    src: '图片加载',
    resize: '缩放模式',
    tintColor: 'tintColor',
    blurRadius: '模糊半径',
    frame: '尺寸布局',
    overflow: '溢出裁剪',
    zIndex: '层级',
  };
  return map[prop] || prop;
}

function getStyleVariants(prop) {
  const variants = {
    opacity: [
      { value: '0.2f', label: '0.2' },
      { value: '0.5f', label: '0.5' },
      { value: '0.8f', label: '0.8' },
      { value: '1.0f', label: '1.0' },
    ],
    borderRadius: [
      { value: '0f', label: '0' },
      { value: '8f', label: '8' },
      { value: '16f', label: '16' },
      { value: '30f', label: '圆' },
    ],
  };
  return variants[prop] || [
    { value: '', label: 'v1' },
    { value: '', label: 'v2' },
  ];
}

// ---------------------------------------------------------------------------
// Step 3: Dispatch to correct template
// ---------------------------------------------------------------------------

let kotlinCode;
switch (suggestedCategory) {
  case 'interactions':
    kotlinCode = generateInteractionsPage(pageName, packageName, fileName, stateTransitions, events, props);
    break;
  case 'modules':
    kotlinCode = generateModulesPage(pageName, packageName, fileName, moduleMethods, stateTransitions);
    break;
  case 'animations':
    kotlinCode = generateAnimationsPage(pageName, packageName, fileName, stateTransitions, events);
    break;
  case 'styles':
    kotlinCode = generateStylesPage(pageName, packageName, fileName, props);
    break;
  default:
    kotlinCode = generateComponentsPage(pageName, packageName, fileName, props);
    break;
}

// ---------------------------------------------------------------------------
// Step 4 (B3): Build pageProfile entry for interaction-protocol.json
// ---------------------------------------------------------------------------

function buildPageProfileEntry(pageName, category, suggestedActionScripts) {
  if (!suggestedActionScripts.length) return null;

  const categoryDefaults = {
    interactions: { actions: ['click-visible-labels'], maxActionLabels: 3, postActionWaitMs: 400 },
    modules:      { actions: ['run-action-scripts'],   maxActionLabels: 2, postActionWaitMs: 800 },
    animations:   { actions: ['click-visible-labels'], maxActionLabels: 2, postActionWaitMs: 600 },
    components:   { actions: ['click-visible-labels'], maxActionLabels: 2, postActionWaitMs: 250 },
    styles:       { actions: [],                       maxActionLabels: 0, postActionWaitMs: 250 },
  };

  const defaults = categoryDefaults[category] || categoryDefaults.components;

  // Decide primary action type
  const hasActionScripts = suggestedActionScripts.length > 0;
  const actions = hasActionScripts
    ? [...new Set([...defaults.actions, 'run-action-scripts'])]
    : defaults.actions;

  return {
    actions,
    actionScripts: hasActionScripts ? suggestedActionScripts : [],
    maxActionLabels: defaults.maxActionLabels,
    postActionWaitMs: defaults.postActionWaitMs,
  };
}

const pageProfileEntry = buildPageProfileEntry(pageName, suggestedCategory, suggestedActionScripts);

// ---------------------------------------------------------------------------
// Step 5: Write files (if --write)
// ---------------------------------------------------------------------------

let written = false;
let warnings = [];

if (!dryRun) {
  // Write Kotlin file
  if (existsSync(outputPath)) {
    warnings.push(`Skipped writing Kotlin file — already exists: ${toPosix(relative(repoRoot, outputPath))}`);
  } else {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, kotlinCode, 'utf8');
    written = true;
  }

  // Update interaction-protocol.json (B3)
  if (pageProfileEntry) {
    const protocol = JSON.parse(readFileSync(INTERACTION_PROTOCOL_PATH, 'utf8'));
    if (!protocol.pageProfiles) protocol.pageProfiles = {};

    if (protocol.pageProfiles[pageName]) {
      warnings.push(`Skipped updating pageProfiles — entry already exists for ${pageName}`);
    } else {
      protocol.pageProfiles[pageName] = pageProfileEntry;
      writeFileSync(INTERACTION_PROTOCOL_PATH, JSON.stringify(protocol, null, 2) + '\n', 'utf8');
    }
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

console.log(JSON.stringify({
  pageName,
  suggestedCategory,
  kotlinFile: toPosix(relative(repoRoot, outputPath)),
  kotlinCode,
  pageProfileEntry,
  testability,
  dryRun,
  written,
  warnings,
}, null, 2));
