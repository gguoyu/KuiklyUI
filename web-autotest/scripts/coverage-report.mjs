#!/usr/bin/env node
/**
 * Generate Kotlin coverage reports from Playwright V8 coverage.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join, normalize, relative, resolve } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import webE2EConfig from '../config/index.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const MCR = require('monocart-coverage-reports');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const istanbulLibReport = require('istanbul-lib-report');
const istanbulReports = require('istanbul-reports');

const { coverage: coverageConfig, reporting } = webE2EConfig;
const e2eRoot = join(__dirname, '..');
const projectRoot = join(e2eRoot, '..');
const v8OutputDir = join(e2eRoot, reporting.v8TempDirName);
const reportDir = join(e2eRoot, reporting.coverageDir);
const generatedKotlinOutputDir = normalize(join(projectRoot, coverageConfig.generatedKotlinOutputDir));
const coverageScopeRoots = coverageConfig.scopeRoots.map((scopeRoot) => normalize(join(projectRoot, scopeRoot)));
const coverageExcludePaths = (coverageConfig.excludePaths || []).map((p) => normalize(join(projectRoot, p)));
const targetModuleSet = new Set(coverageConfig.targetModules);

// Derive the repo-relative anchor used to recognise source paths embedded in sourcemaps.
// e.g. scopeRoots = ['core-render-web/base/...', 'core-render-web/h5/...']
//   → scopeRootAnchor = 'core-render-web/'
// This avoids hard-coding the path segment; it is read from kuikly.autotest.config.cjs instead.
function longestCommonPrefix(strings) {
  if (!strings.length) return '';
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}
const scopeRootAnchor = (() => {
  const normalizedRoots = coverageConfig.scopeRoots.map((r) => r.replace(/\\/g, '/'));
  const prefix = longestCommonPrefix(normalizedRoots);
  // Trim to the last complete path segment (up to and including the trailing slash)
  const slashIndex = prefix.lastIndexOf('/');
  return slashIndex === -1 ? prefix : prefix.slice(0, slashIndex + 1);
})();
const distFileCache = new Map();
const sourceMapCache = new Map();
const sourceLineCache = new Map();
const structuralNeutralLineCache = new Map();
const checkOnly = process.argv.includes('--check');
const htmlSpaMetricsToShow = ['lines', 'branches', 'functions'];
const htmlSpaDefaultHash = '#file/desc/true/true/true//';
const syntheticAccessorNamePattern = /^(?:<get-|<set-|_get_|_set_)/;
const syntheticDefaultMethodNamePattern = /\$default$/;
const classSignatureLinePattern = /^\s*(?:(?:public|private|protected|internal|open|final|abstract|sealed|data|enum|annotation|value|inner|expect|actual|companion)\s+)*(?:class|interface|object)\b/;
const interfaceSignatureLinePattern = /^\s*(?:(?:public|private|protected|internal|open|final|abstract|sealed|data|enum|annotation|value|inner|expect|actual|companion)\s+)*interface\b/;
const abstractFunctionDeclarationLinePattern = /^\s*(?:(?:public|private|protected|internal|open|final|abstract|override|tailrec|operator|suspend|infix|external|expect|actual|inline|value|context)\s+)*fun\b/;
const propertyDeclarationLinePattern = /^\s*(?:(?:public|private|protected|internal|open|final|abstract|sealed|lateinit|override|tailrec|operator|suspend|infix|external|expect|actual|inline|value|const|vararg|crossinline|noinline|reified|out|in)\s+)*(?:const\s+)?(?:val|var)\b/;
const propertyAccessorLinePattern = /^\s*(?:get|set)\s*\(/;
const constructorDelegationLinePattern = /^\s*constructor\b[\s\S]*:\s*this\(/;
const syntheticConstructorInitNamePattern = /_init_\$(?:Init|Create)\$_/;
const partialControlLinePattern = /^\s*(?:\}\s*)*(?:if\b|else\b|when\b|catch\b|finally\b|try\b)/;
const customBaseCssMarker = '/* kuiklyui-kotlin-line-patch */';
const customSpaCssMarker = '/* kuiklyui-spa-color-patch */';

if (!existsSync(v8OutputDir)) {
  console.error('.v8_output does not exist, run V8 coverage tests first');
  console.error('Recommended: node scripts/kuikly-test.mjs --full');
  process.exit(1);
}

function isTargetModuleName(fileName) {
  return targetModuleSet.has(fileName);
}

function getEntryFileName(url) {
  if (typeof url !== 'string' || !url) {
    return '';
  }

  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
  } catch {
    return decodeURIComponent(url.split('/').pop() || '');
  }
}

function resolveDistFileFromUrl(url) {
  if (distFileCache.has(url)) {
    return distFileCache.get(url);
  }

  const fileName = getEntryFileName(url);
  if (!isTargetModuleName(fileName)) {
    distFileCache.set(url, null);
    return null;
  }

  const candidate = join(generatedKotlinOutputDir, fileName);
  const resolvedDistFile = existsSync(candidate) ? candidate : null;
  distFileCache.set(url, resolvedDistFile);
  return resolvedDistFile;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function resolveSourceMapSourceFilePath(sourcePath, distFile) {
  const normalizedInput = sourcePath.replace(/\\/g, '/');
  const projectScopedIndex = scopeRootAnchor ? normalizedInput.indexOf(scopeRootAnchor) : -1;
  if (projectScopedIndex !== -1) {
    return normalize(resolve(projectRoot, normalizedInput.slice(projectScopedIndex)));
  }
  return normalize(resolve(dirname(distFile), normalizedInput));
}

function readSourceMapForDistFile(distFile) {
  if (sourceMapCache.has(distFile)) {
    return sourceMapCache.get(distFile);
  }

  const sourceMapPath = `${distFile}.map`;
  if (!existsSync(sourceMapPath)) {
    sourceMapCache.set(distFile, null);
    return null;
  }

  const sourceMap = readJson(sourceMapPath);
  const sources = Array.isArray(sourceMap.sources) ? sourceMap.sources : [];
  const sourcesContent = Array.isArray(sourceMap.sourcesContent)
    ? [...sourceMap.sourcesContent]
    : Array(sources.length).fill(null);

  sources.forEach((sourcePath, index) => {
    if (sourcesContent[index] != null) {
      return;
    }

    const candidate = resolveSourceMapSourceFilePath(sourcePath, distFile);
    if (existsSync(candidate)) {
      sourcesContent[index] = readFileSync(candidate, 'utf8');
    }
  });

  sourceMap.sourcesContent = sourcesContent;
  sourceMapCache.set(distFile, sourceMap);
  return sourceMap;
}

function readRawCoverageEntries() {
  const entries = [];

  for (const fileName of readdirSync(v8OutputDir)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    const filePath = join(v8OutputDir, fileName);
    const payload = readJson(filePath);
    if (!Array.isArray(payload?.result)) {
      continue;
    }

    for (const entry of payload.result) {
      if (!isTargetModuleName(getEntryFileName(entry.url))) {
        continue;
      }
      entries.push(entry);
    }
  }

  return entries;
}

function prepareEntriesForKotlinReport(entries) {
  return entries.map((entry) => {
    const distFile = resolveDistFileFromUrl(entry.url);
    return {
      ...entry,
      distFile: distFile || entry.distFile,
      sourceMap: distFile ? (readSourceMapForDistFile(distFile) || entry.sourceMap) : entry.sourceMap,
    };
  });
}

function resolveSourcePath(filePath, info = {}) {
  if (typeof filePath !== 'string' || !filePath) {
    return filePath;
  }

  const normalizedInput = filePath.replace(/\\/g, '/');
  const projectScopedIndex = scopeRootAnchor ? normalizedInput.indexOf(scopeRootAnchor) : -1;
  if (projectScopedIndex !== -1) {
    return normalize(resolve(projectRoot, normalizedInput.slice(projectScopedIndex)));
  }

  if (/^[a-zA-Z]:[\\/]/.test(filePath) || filePath.startsWith('/')) {
    return normalize(filePath);
  }

  if (info.distFile) {
    const kotlinModulesMarker = 'kotlin-modules/';
    const markerIndex = normalizedInput.indexOf(kotlinModulesMarker);
    const relativePath = markerIndex === -1
      ? normalizedInput
      : normalizedInput.slice(markerIndex + kotlinModulesMarker.length);
    return normalize(resolve(dirname(info.distFile), relativePath));
  }

  return normalize(resolve(projectRoot, normalizedInput));
}

function isInCoverageScope(filePath) {
  const normalizedPath = normalize(filePath);
  if (coverageExcludePaths.some((excludePath) => normalizedPath.startsWith(excludePath))) {
    return false;
  }
  return coverageScopeRoots.some((scopeRoot) => normalizedPath.startsWith(scopeRoot));
}

function getThresholds() {
  return coverageConfig.thresholds;
}

function formatPct(value) {
  return typeof value === 'number' ? value.toFixed(2) : String(value);
}

function readIstanbulSummaryTotal() {
  const summaryPath = join(reportDir, 'coverage-summary.json');
  if (!existsSync(summaryPath)) {
    throw new Error(`coverage-summary.json not found: ${summaryPath}`);
  }

  const summary = readJson(summaryPath);
  return summary.total || summary;
}

function assertCoverageThresholds(summary) {
  const thresholds = getThresholds();
  const errors = [];

  for (const [metric, threshold] of Object.entries(thresholds)) {
    const actual = summary?.[metric]?.pct;
    const numericActual = typeof actual === 'number' ? actual : Number(actual || 0);
    if (numericActual < threshold) {
      errors.push(`Coverage for ${metric} (${formatPct(actual)}%) does not meet global threshold (${threshold}%)`);
    }
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
}

function getIstanbulReportEntries() {
  return checkOnly
    ? [
        ['text-summary'],
        ['json'],
        ['json-summary'],
      ]
    : [
        ['text-summary'],
        ['html-spa', { metricsToShow: htmlSpaMetricsToShow }],
        ['lcovonly'],
        ['json'],
        ['json-summary'],
      ];
}

function getSourceLines(filePath) {
  if (sourceLineCache.has(filePath)) {
    return sourceLineCache.get(filePath);
  }

  const lines = existsSync(filePath)
    ? readFileSync(filePath, 'utf8').split(/\r?\n/u)
    : [];
  sourceLineCache.set(filePath, lines);
  return lines;
}

function getLineText(lines, lineNumber) {
  if (!lineNumber || lineNumber < 1 || lineNumber > lines.length) {
    return '';
  }
  return lines[lineNumber - 1] || '';
}

function isClassSignatureLine(lineText) {
  return classSignatureLinePattern.test(lineText.trim());
}

function isPrimaryConstructorPropertyLine(lineText) {
  const trimmed = lineText.trim();
  return propertyDeclarationLinePattern.test(trimmed) && !/\bfun\b/u.test(trimmed);
}

function isRuntimeInitializedPrimaryConstructorPropertyLine(lineText) {
  const trimmed = lineText.trim();
  return isPrimaryConstructorPropertyLine(trimmed) && hasPropertyInitializer(trimmed);
}

function isPropertyAccessorLine(lineText) {
  return propertyAccessorLinePattern.test(lineText.trim());
}

function isBlockFunctionHeaderLine(lineText) {
  const trimmed = lineText.trim();
  return /\bfun\b/u.test(trimmed)
    && trimmed.includes('{')
    && !/\)\s*(?::[^=]+)?\s*=\s*/u.test(trimmed)
    && !isPropertyAccessorLine(trimmed);
}

function isMultilineFunctionHeaderStartLine(lineText) {
  const trimmed = lineText.trim();
  return /\bfun\b/u.test(trimmed)
    && !trimmed.includes('{')
    && !isPropertyAccessorLine(trimmed)
    // Expression-body functions (`fun foo(): Type = expr`) are NOT multi-line
    // header starts — the `= expr` part is executable code.
    && !/\)\s*(?::[^=]+)?\s*=\s*\S/u.test(trimmed);
}

function isSingleLineEmptyBlockFunctionLine(lineText) {
  const stripped = lineText.split('//')[0].trim();
  return isBlockFunctionHeaderLine(stripped) && /\{\s*\}\s*$/u.test(stripped);
}

function isConstPropertyDeclaration(lineText) {
  return /\bconst\s+val\b/u.test(lineText.trim());
}

function hasPropertyInitializer(lineText) {
  return lineText.split('//')[0].includes('=');
}

function isRuntimeInitializedPropertyDeclaration(lineText) {
  const trimmed = lineText.trim();
  return propertyDeclarationLinePattern.test(trimmed)
    && !/\bfun\b/u.test(trimmed)
    && !isConstPropertyDeclaration(trimmed)
    && hasPropertyInitializer(trimmed);
}

function isPropertyDeclarationHeaderLine(lineText) {
  const trimmed = lineText.trim();
  return propertyDeclarationLinePattern.test(trimmed)
    && !/\bfun\b/u.test(trimmed)
    && !hasPropertyInitializer(trimmed);
}

function isMultilineInitializedPropertyHeaderLine(lineText) {
  const trimmed = lineText.trim();
  return propertyDeclarationLinePattern.test(trimmed)
    && !/\bfun\b/u.test(trimmed)
    && hasPropertyInitializer(trimmed)
    && !trimmed.endsWith("}")
    && !trimmed.endsWith(")")
    && !trimmed.endsWith("]")
    && (/(?:=\s*$|=\s*(?:if|when)\b[\s\S]*$|=\s*\{\s*$)/u.test(trimmed)
      || /(?:->\s*$)/u.test(trimmed));
}

function isMultilineLambdaInitializedPropertyHeaderLine(sourceLines, lineNumber) {
  const trimmed = getLineText(sourceLines, lineNumber).trim();
  if (!propertyDeclarationLinePattern.test(trimmed)
    || /\bfun\b/u.test(trimmed)
    || !hasPropertyInitializer(trimmed)
    || !/=\s*$/u.test(trimmed)) {
    return false;
  }

  const nextLineNumber = findNextMeaningfulLineNumber(sourceLines, lineNumber, 3);
  if (!nextLineNumber) {
    return false;
  }

  return /^\{[\s\S]*->\s*$/u.test(getLineText(sourceLines, nextLineNumber).trim());
}

function isNonRuntimePropertyDeclaration(lineText) {
  const trimmed = lineText.trim();
  return propertyDeclarationLinePattern.test(trimmed)
    && !/\bfun\b/u.test(trimmed)
    && (isConstPropertyDeclaration(trimmed) || !hasPropertyInitializer(trimmed));
}

function isCommentOnlyLine(lineText) {
  const trimmed = lineText.trim();
  return !trimmed
    || trimmed.startsWith('//')
    || trimmed.startsWith('/**')
    || trimmed.startsWith('/*')
    || trimmed.startsWith('*')
    || trimmed.startsWith('*/');
}

function isPackageOrImportLine(lineText) {
  return /^(?:package|import)\b/u.test(lineText.trim());
}

function isAnnotationLine(lineText) {
  return /^@/u.test(lineText.trim());
}

function isInitBlockLine(lineText) {
  return /^init\s*\{/u.test(lineText.trim());
}

function isStructuralElseLine(lineText) {
  return /^\}?\s*else\b(?:\s*\{)?\s*$/u.test(lineText.trim());
}

function isPureClosingLine(lineText) {
  const trimmed = lineText.trim();
  const commentStripped = trimmed.replace(/\s*(?:\/\/.*|\/\*.*)$/u, '').trim();
  return !!commentStripped && /^[)\]};,]+(?:\s*\{)?$/u.test(commentStripped);
}

function isConstructorDelegationLine(lineText) {
  return constructorDelegationLinePattern.test(lineText.trim());
}


function isTypeSignatureContinuationLine(trimmed, previousLineText) {
  // Type signature continuation lines inside property declarations:
  // Lines that are part of type annotations (generics, function types, etc)
  // identified by containing type parameters inside parentheses.
  
  if (!previousLineText) {
    return false;
  }
  
  const prevTrimmed = previousLineText.trim();
  
  // Count unclosed parentheses in the previous line
  const prevOpenParen = (prevTrimmed.match(/\(/g) || []).length;
  const prevCloseParen = (prevTrimmed.match(/\)/g) || []).length;
  const hasUnclosedParen = prevOpenParen > prevCloseParen;
  
  // Current line is part of type signature if previous had unclosed parens
  if (hasUnclosedParen && !trimmed.includes('{') && !/^\s*=\s*/.test(trimmed)) {
    const isTypeParam = trimmed.includes(':') && !trimmed.includes('=');
    const isClosingParen = /^\s*\)/.test(trimmed);
    return isTypeParam || isClosingParen;
  }
  
  return false;
}
function isObjectLiteralConstructor(lineText) {
  // Detect if this line contains an object literal constructor like: object : InterfaceName {
  // Object literals in Kotlin are not actual function calls that execute, so covered methods
  // inside them don't reliably indicate the object was instantiated.
  const trimmed = lineText.trim();
  return /object\s*:\s*\w+/u.test(trimmed);
}

function isWhenArmHeaderLine(lineText) {
  // Detect when-arm header: "is SomeType -> " or "else -> "
  const trimmed = lineText.trim();
  return /^(?:is\s+\w+|\w+\s*,|\s*else)\s*->/.test(trimmed);
}

function isIfHeaderLine(lineText) {
  // Detect if condition header or else if: "if (...) {" or "else if (...) {"
  const trimmed = lineText.trim();
  return /^(?:else\s+)?if\s*\(/.test(trimmed) && !trimmed.includes('=');
}

function isControlFlowHeaderLine(lineText) {
  // Detect any control-flow header: when-arm or if/else-if
  return isWhenArmHeaderLine(lineText) || isIfHeaderLine(lineText);
}

function isInlineWhenArmLine(lineText) {
  const trimmed = lineText.trim().replace(/^(?:\}\s*)+/u, '');
  return trimmed.includes('->') && !/->\s*\{\s*$/u.test(trimmed);
}

function findEnclosingWhenBlockRange(sourceLines, lineNumber) {
  for (let cursor = lineNumber; cursor >= 1; cursor -= 1) {
    const lineText = getLineText(sourceLines, cursor).trim();
    if (!/\bwhen\b[\s\S]*\{\s*$/u.test(lineText)) {
      continue;
    }
    const endLine = findBlockEndLine(sourceLines, cursor);
    if (lineNumber <= endLine) {
      return { startLine: cursor, endLine };
    }
  }
  return null;
}

// Detect if a line is likely executable Kotlin code (not structural/declarative).
// Used in the lineCount==null fallback of deriveLineStatus to return 'no' (uncovered)
// instead of 'neutral' for lines that are clearly code but have no Istanbul mapping.
function isLikelyExecutableLine(lineText) {
  const trimmed = lineText.trim();
  if (!trimmed) {
    return false;
  }
  // Comments, annotations, package/import are not executable
  if (/^(?:\/\/|\/\*|\*|@|package\b|import\b)/u.test(trimmed)) {
    return false;
  }
  // Pure structural tokens are not executable
  if (/^[)\]};,]+$/u.test(trimmed)) {
    return false;
  }
  // When-arm bodies (e.g., `"Win" in userAgent -> " 8.1"`, `is Long -> { ... }`)
  if (trimmed.includes('->')) {
    return true;
  }
  // Assignment, function calls, property access, operators
  if (/[=(.]/.test(trimmed)) {
    return true;
  }
  // Variable/val declarations with initializers
  if (/^(?:val|var)\b.*=/u.test(trimmed)) {
    return true;
  }
  // Keywords indicating executable statements
  if (/^(?:return|throw|if|else|when|for|while|do|try|catch|finally)\b/u.test(trimmed)) {
    return true;
  }
  return false;
}

function markAbstractInterfaceMemberLinesNeutral(sourceLines, neutralLines) {
  let inBlockComment = false;
  let pendingInterfaceHeader = false;
  let interfaceDepth = 0;

  sourceLines.forEach((lineText, index) => {
    const lineNumber = index + 1;
    const trimmed = (lineText || '').trim();

    if (!trimmed) {
      return;
    }

function isOverrideFunction(lineText) {
  // Detect override keyword in function or property declarations
  const trimmed = lineText.trim();
  return /^override\s+(fun|val|var)/u.test(trimmed);
}

    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      return;
    }

    if (trimmed.startsWith('/**') || trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      return;
    }

    if (pendingInterfaceHeader && trimmed.includes('{')) {
      pendingInterfaceHeader = false;
      interfaceDepth = 1;
      return;
    }

    if (interfaceSignatureLinePattern.test(trimmed)) {
      if (trimmed.includes('{')) {
        interfaceDepth = 1;
      } else {
        pendingInterfaceHeader = true;
      }
      return;
    }

    if (/\babstract\b/u.test(trimmed)
      && abstractFunctionDeclarationLinePattern.test(trimmed)
      && !trimmed.includes('{')
      && /\)\s*(?::.*)?$/u.test(trimmed)) {
      neutralLines.add(lineNumber);
    }

    if (interfaceDepth > 0
      && abstractFunctionDeclarationLinePattern.test(trimmed)
      && !trimmed.includes('{')
      && /\)\s*(?::.*)?$/u.test(trimmed)) {
      neutralLines.add(lineNumber);
    }

    if (interfaceDepth > 0) {
      const openCount = (trimmed.match(/\{/g) || []).length;
      const closeCount = (trimmed.match(/\}/g) || []).length;
      interfaceDepth += openCount - closeCount;
      if (interfaceDepth < 0) {
        interfaceDepth = 0;
      }
    }
  });
}

function buildStructuralNeutralLineSet(filePath, sourceLines) {
  if (structuralNeutralLineCache.has(filePath)) {
    return structuralNeutralLineCache.get(filePath);
  }

  const neutralLines = new Set();
  let inBlockComment = false;
  let inClassHeader = false;
  let inFunctionHeader = false;
  let inPropertyTypeAnnotation = false;
  let propertyTypeParenDepth = 0;
  let previousLineText = null;

  sourceLines.forEach((lineText, index) => {
    const lineNumber = index + 1;
    const trimmed = (lineText || '').trim();

    if (!trimmed) {
      neutralLines.add(lineNumber);
      return;
    }

    if (inBlockComment) {
      neutralLines.add(lineNumber);
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      return;
    }

    if (trimmed.startsWith('/**') || trimmed.startsWith('/*')) {
      neutralLines.add(lineNumber);
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      return;
    }

    if (
      trimmed.startsWith('*')
      || trimmed.startsWith('//')
      || isPackageOrImportLine(trimmed)
      || isAnnotationLine(trimmed)
      || isInitBlockLine(trimmed)
      || isStructuralElseLine(trimmed)
      || isPureClosingLine(trimmed)
    ) {
      neutralLines.add(lineNumber);
      return;
    }

    // Multi-line function header continuation lines (parameter declarations,
    // closing bracket with return type) are not executable — mark as neutral.
    // Type signature lines (multiline type declarations) should be neutral
    if (previousLineText && isTypeSignatureContinuationLine(trimmed, previousLineText)) {
      neutralLines.add(lineNumber);
    }
    if (inFunctionHeader) {
      neutralLines.add(lineNumber);
      if (trimmed.includes('{') || trimmed.includes('=')) {
        inFunctionHeader = false;
      } else if (/^\s*\)\s*;?\s*$/u.test(trimmed)) {
        // Interface/abstract function declaration ending with ");"
        inFunctionHeader = false;
      }
      return;
    }

    if (inClassHeader) {
      if (!isRuntimeInitializedPrimaryConstructorPropertyLine(trimmed)) {
        neutralLines.add(lineNumber);
      }
      if (trimmed.includes('{')) {
        inClassHeader = false;
      }
      return;
    }

    if (isClassSignatureLine(trimmed)) {
      neutralLines.add(lineNumber);
      if (!trimmed.includes('{')) {
        inClassHeader = true;
      }
      return;
    }

    if (isNonRuntimePropertyDeclaration(trimmed)) {
      neutralLines.add(lineNumber);
    }

    // Multi-line property type annotation tracking:
    // Property declarations like `var cb: ((A, B) -> Unit)? = null` can span
    // multiple lines. The type parameter continuation lines are not executable.
    if (inPropertyTypeAnnotation) {
      neutralLines.add(lineNumber);
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      propertyTypeParenDepth += openParens - closeParens;
      if (propertyTypeParenDepth <= 0 || trimmed.includes('= null') || /=\s*\S/.test(trimmed)) {
        inPropertyTypeAnnotation = false;
        propertyTypeParenDepth = 0;
      }
      previousLineText = lineText;
      return;
    }

    // Detect start of multi-line property type annotations:
    // `val/var name: ((` or `val/var name: (` where the type doesn't close on the same line
    if (propertyDeclarationLinePattern.test(trimmed) && /:\s*\(/.test(trimmed)) {
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        inPropertyTypeAnnotation = true;
        propertyTypeParenDepth = openParens - closeParens;
      }
    }

    // Block function header lines (`fun ... {`) are not executable statements
    // themselves — they are entry-point markers. Regardless of whether the
    // function was called, the declaration line should display as neutral.
    if (isBlockFunctionHeaderLine(trimmed)) {
      neutralLines.add(lineNumber);
    }

    // Multi-line function header start (`fun ...` without `{` on the same line):
    // the fun line and all continuation lines (parameters, return type) are
    // purely declarative and should be neutral.
    if (isMultilineFunctionHeaderStartLine(trimmed)) {
      neutralLines.add(lineNumber);
      inFunctionHeader = true;
    }
    previousLineText = lineText;
  });

  markAbstractInterfaceMemberLinesNeutral(sourceLines, neutralLines);
  structuralNeutralLineCache.set(filePath, neutralLines);
  return neutralLines;
}

function isMisclassifiedExecutableFunctionBodyLine(sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!lineText || !isLikelyExecutableLine(lineText)) {
    return false;
  }

  const enclosingFunction = findEnclosingBlockFunctionRange(sourceLines, lineNumber);
  if (!enclosingFunction) {
    return false;
  }

  const signatureEndLine = findFunctionSignatureEndLine(sourceLines, enclosingFunction.startLine, lineNumber);
  return lineNumber > signatureEndLine;
}

function isForceNeutralLine(filePath, sourceLines, lineNumber) {
  return buildStructuralNeutralLineSet(filePath, sourceLines).has(lineNumber)
    && !isMisclassifiedExecutableFunctionBodyLine(sourceLines, lineNumber);
}

function cloneCoverageData(coverageData) {
  return JSON.parse(JSON.stringify(coverageData));
}

function getRangeLines(range) {
  const startLine = range?.start?.line;
  const endLine = range?.end?.line;
  if (!startLine || !endLine) {
    return [];
  }
  const lines = [];
  for (let line = startLine; line <= endLine; line += 1) {
    lines.push(line);
  }
  return lines;
}

function setLineCoverage(lineCoverage, lineNumber, count) {
  if (!lineNumber) {
    return;
  }

  const current = lineCoverage[lineNumber];
  if (current == null || Number(count) > current) {
    lineCoverage[lineNumber] = Number(count);
  }
}

function getExecutableLines(range, filePath, sourceLines) {
  return getRangeLines(range).filter((lineNumber) => !isForceNeutralLine(filePath, sourceLines, lineNumber));
}

function findPreviousMeaningfulLineText(sourceLines, lineNumber, maxLookback = 6) {
  const startLine = Math.max(1, lineNumber - maxLookback);
  for (let cursor = lineNumber - 1; cursor >= startLine; cursor -= 1) {
    const lineText = getLineText(sourceLines, cursor).trim();
    if (!lineText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(lineText)) {
      continue;
    }
    return lineText;
  }
  return '';
}

function findNextMeaningfulLineText(sourceLines, lineNumber, maxLookahead = 6) {
  const endLine = Math.min(sourceLines.length, lineNumber + maxLookahead);
  for (let cursor = lineNumber + 1; cursor <= endLine; cursor += 1) {
    const lineText = getLineText(sourceLines, cursor).trim();
    if (!lineText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(lineText)) {
      continue;
    }
    return lineText;
  }
  return '';
}

function findNextMeaningfulLineNumber(sourceLines, lineNumber, maxLookahead = 6) {
  const endLine = Math.min(sourceLines.length, lineNumber + maxLookahead);
  for (let cursor = lineNumber + 1; cursor <= endLine; cursor += 1) {
    const lineText = getLineText(sourceLines, cursor).trim();
    if (!lineText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(lineText)) {
      continue;
    }
    return cursor;
  }
  return null;
}

function isSimpleExpressionLikeLine(lineText) {
  const trimmed = lineText.trim();
  if (!trimmed || /[{}]/u.test(trimmed)) {
    return false;
  }
  if (/^(?:if|else\b|when\b|for\b|while\b|do\b|try\b|catch\b|finally\b|return\b|throw\b)/u.test(trimmed)) {
    return false;
  }
  return /^(?:this\b|super\b|[A-Za-z_][\w?.<>]*)(?:[[(.].*)?$/u.test(trimmed);
}

function isCoveredContinuationLine(sourceLines, lineNumber) {
  const currentLine = getLineText(sourceLines, lineNumber).trim();
  const previousLine = findPreviousMeaningfulLineText(sourceLines, lineNumber);
  const nextLine = findNextMeaningfulLineText(sourceLines, lineNumber);
  if (!currentLine) {
    return false;
  }

  if (/^(?:\(|\.|\?\.|\?:|\|\||&&|as\?|as\b|else\b)/u.test(currentLine)) {
    return true;
  }

  if (/^\}\s*(?:as\?|as\b|\.\s*|\?\.\s*|\?:)/u.test(currentLine)) {
    return true;
  }

  if (/(?:=|return)\s*if\b/u.test(previousLine)) {
    return true;
  }

  const previousLineEndsWithContinuationToken = /(?:\(|\|\||&&|\?:|\.\s*|\?\.\s*|,|[+\-*/%]=?|=)\s*$/u.test(previousLine);
  const previousLineEndsWithIncrementOrDecrement = /(?:\+\+|--)\s*$/u.test(previousLine);
  if ((previousLineEndsWithContinuationToken && !previousLineEndsWithIncrementOrDecrement)
    || /\bwhen\s*\{\s*$/u.test(previousLine)) {
    return true;
  }

  if (/\{\s*$/u.test(previousLine) && isSimpleExpressionLikeLine(currentLine)) {
    return true;
  }

  return /^\}/u.test(previousLine)
    && isSimpleExpressionLikeLine(currentLine)
    && /^(?:\}|\)|else\b|catch\b|finally\b)/u.test(nextLine);
}

function isMultilineControlConditionContinuationLine(sourceLines, lineNumber) {
  const currentLine = getLineText(sourceLines, lineNumber).trim();
  if (!currentLine || !isCoveredContinuationLine(sourceLines, lineNumber)) {
    return false;
  }

  const nextLine = findNextMeaningfulLineText(sourceLines, lineNumber, 3);
  if (!/^\)\s*\{/u.test(nextLine)) {
    return false;
  }

  for (let cursor = lineNumber - 1, minLine = Math.max(1, lineNumber - 4); cursor >= minLine; cursor -= 1) {
    const candidateText = getLineText(sourceLines, cursor).trim().replace(/^(?:\}\s*)+/u, '');
    if (!candidateText) {
      continue;
    }

    if (/^(?:if|else\s+if|while|for)\b[\s\S]*\(\s*$/u.test(candidateText)
      || /^(?:val|var)\b[\s\S]*=\s*if\s*\(\s*$/u.test(candidateText)
      || /^return\s+if\s*\(\s*$/u.test(candidateText)) {
      return true;
    }

    if (/[;{}]/u.test(candidateText) && !/\(\s*$/u.test(candidateText)) {
      break;
    }
  }

  return false;
}

function getCoveredConstructorDelegationStartLines(fileCoverage, sourceLines) {
  const coveredLines = new Set();

  for (const [statementId, loc] of Object.entries(fileCoverage.statementMap || {})) {
    if (Number(fileCoverage.s?.[statementId] || 0) <= 0) {
      continue;
    }

    for (const lineNumber of getRangeLines(loc)) {
      if (isConstructorDelegationLine(getLineText(sourceLines, lineNumber))) {
        coveredLines.add(lineNumber);
      }
    }
  }

  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    if (Number(fileCoverage.f?.[functionId] || 0) <= 0) {
      continue;
    }

    const declLine = functionCoverage?.decl?.start?.line;
    if (declLine && isConstructorDelegationLine(getLineText(sourceLines, declLine))) {
      coveredLines.add(declLine);
    }
  }

  return coveredLines;
}

function findConstructorDelegationEndLine(sourceLines, startLine) {
  let depth = 0;
  for (let lineNumber = startLine; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber);
    for (const ch of lineText) {
      if (ch === '(') {
        depth += 1;
      } else if (ch === ')') {
        depth -= 1;
      }
    }

    if (lineNumber > startLine && depth <= 0) {
      return lineNumber;
    }
  }
  return startLine;
}

function applyCoveredConstructorDelegationContinuations(lineCoverage, filePath, sourceLines, coveredConstructorStartLines) {
  for (const startLine of coveredConstructorStartLines) {
    const startCount = lineCoverage[startLine];
    if (!(startCount > 0)) {
      continue;
    }

    const endLine = findConstructorDelegationEndLine(sourceLines, startLine);
    for (let lineNumber = startLine + 1; lineNumber < endLine; lineNumber += 1) {
      if (lineCoverage[lineNumber] != null || isForceNeutralLine(filePath, sourceLines, lineNumber)) {
        continue;
      }
      if (isCoveredContinuationLine(sourceLines, lineNumber)) {
        lineCoverage[lineNumber] = startCount;
      }
    }
  }
}

function rangeIncludesCoveredConstructorDelegation(range, coveredConstructorStartLines) {
  return getRangeLines(range).some((lineNumber) => coveredConstructorStartLines.has(lineNumber));
}

function applyCoveredContinuationCandidates(fileCoverage, lineCoverage, continuationCandidates, sourceLines) {
  for (const [lineNumber, count] of continuationCandidates.entries()) {
    if (!isCoveredContinuationLine(sourceLines, lineNumber)) {
      continue;
    }

    const previousLineText = getLineText(sourceLines, lineNumber - 1).trim();
    if (/\bwhen\s*\{\s*$/u.test(previousLineText) && !(Number(lineCoverage[lineNumber - 1]) > 0)) {
      continue;
    }

    if (lineCoverage[lineNumber] == null) {
      lineCoverage[lineNumber] = count;
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (lineCoverage[lineNumber] === 0 && (directStatementCount == null || directStatementCount === 0)) {
      lineCoverage[lineNumber] = count;
    }
  }
}

function applyConstructorInitializerFallback(fileCoverage, filePath, sourceLines, lineCoverage) {
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    const count = Number(fileCoverage.f?.[functionId] || 0);
    if (count <= 0) {
      continue;
    }

    const declStartLine = functionCoverage?.decl?.start?.line;
    const declEndLine = functionCoverage?.decl?.end?.line;
    if (!declStartLine || !declEndLine || !isClassSignatureLine(getLineText(sourceLines, declStartLine))) {
      continue;
    }

    for (let lineNumber = declStartLine + 1; lineNumber <= declEndLine; lineNumber += 1) {
      if (isForceNeutralLine(filePath, sourceLines, lineNumber)) {
        continue;
      }

      if (isRuntimeInitializedPropertyDeclaration(getLineText(sourceLines, lineNumber)) && lineCoverage[lineNumber] == null) {
        lineCoverage[lineNumber] = count;
      }
    }
  }
}

function applyClassBodyRuntimePropertyFallback(fileCoverage, lineCoverage, filePath, sourceLines) {
  sourceLines.forEach((lineText, index) => {
    const lineNumber = index + 1;
    if (isForceNeutralLine(filePath, sourceLines, lineNumber)) {
      return;
    }

    if (!isRuntimeInitializedPropertyDeclaration(lineText)) {
      return;
    }

    if (Number(lineCoverage[lineNumber]) > 0) {
      return;
    }

    const overlappingCoveredCounts = Object.entries(fileCoverage.statementMap || {})
      .filter(([, loc]) => {
        const startLine = loc?.start?.line;
        const endLine = loc?.end?.line;
        return startLine && endLine && startLine <= lineNumber && lineNumber <= endLine;
      })
      .map(([statementId]) => Number(fileCoverage.s?.[statementId] || 0))
      .filter((count) => count > 0);

    if (!overlappingCoveredCounts.length) {
      return;
    }

    lineCoverage[lineNumber] = Math.max(...overlappingCoveredCounts);
  });
}

function computeLineCoverageFromStatements(fileCoverage, filePath, sourceLines) {
  const lineCoverage = {};
  const continuationCandidates = new Map();
  const coveredConstructorStartLines = getCoveredConstructorDelegationStartLines(fileCoverage, sourceLines);

  // Pre-identify unexecuted catch block lines before processing statements.
  // A catch block is unexecuted when no line within it has a covered direct
  // statement (a statement that starts AND ends on the same line with count > 0).
  // Spanning statements (e.g. `return try { … } catch { … }`) cross catch
  // boundaries but only reflect the try-path execution — they must NOT set
  // coverage on catch-block lines.
  const unexecutedCatchLines = buildUnexecutedCatchLineSet(fileCoverage, filePath, sourceLines);

  for (const [statementId, loc] of Object.entries(fileCoverage.statementMap || {})) {
    const count = Number(fileCoverage.s?.[statementId] || 0);
    const executableLines = getExecutableLines(loc, filePath, sourceLines);
    if (!executableLines.length) {
      continue;
    }

    if (count > 0) {
      setLineCoverage(lineCoverage, executableLines[0], count);
      executableLines.slice(1).forEach((lineNumber) => {
        // Skip continuation candidates inside unexecuted catch blocks —
        // the spanning statement's execution count reflects the try path only.
        if (unexecutedCatchLines.has(lineNumber)) {
          return;
        }
        const current = continuationCandidates.get(lineNumber);
        if (current == null || count > current) {
          continuationCandidates.set(lineNumber, count);
        }
      });
      continue;
    }

    const shouldSuppressSyntheticConstructorNoise = rangeIncludesCoveredConstructorDelegation(loc, coveredConstructorStartLines);
    executableLines.forEach((lineNumber) => {
      if (shouldSuppressSyntheticConstructorNoise && lineNumber !== loc?.start?.line) {
        return;
      }
      if (lineCoverage[lineNumber] == null) {
        lineCoverage[lineNumber] = 0;
      }
    });
  }

  applyCoveredContinuationCandidates(fileCoverage, lineCoverage, continuationCandidates, sourceLines);
  applyCoveredConstructorDelegationContinuations(lineCoverage, filePath, sourceLines, coveredConstructorStartLines);
  applyConstructorInitializerFallback(fileCoverage, filePath, sourceLines, lineCoverage);
  applyClassBodyRuntimePropertyFallback(fileCoverage, lineCoverage, filePath, sourceLines);
  const branchStats = buildBranchLineStats(fileCoverage);
  propagateCoveredBranchBodyLines(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteDirectCoveredBranchBodyLines(fileCoverage, lineCoverage, filePath, sourceLines);
  applySimpleFunctionBodyFallback(lineCoverage, filePath, sourceLines, branchStats);
  promoteCoveredSimpleFunctionGapLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteFunctionEntryGapLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  alignFunctionHeaderCoverageWithBody(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteCoveredTopLevelFunctionStatements(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteCoveredBlockFunctionHeaderLines(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteCoveredAccessorHeaderLines(lineCoverage, filePath, sourceLines);
  promoteCoveredMultilineExpressionBodiedFunctionHeaderLines(lineCoverage, filePath, sourceLines);
  promoteMultilineExpressionBodyContinuationLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteSimpleLambdaBodyCoverage(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteClosureBodyCoverage(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteCoveredBuilderWrapperLines(lineCoverage, filePath, sourceLines);
  suppressFalseCoveredLinesInUncoveredBranches(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressFalseCoveredLinesInUncoveredFunctions(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressFalseCoveredWhenElseTailLines(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteCoveredWhenHeaderLines(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteCoveredWhenArmHeaderLines(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteCoveredLoopHeaderLines(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteCoveredMultilineStatementLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteCoveredMultilineStatementTailLines(fileCoverage, lineCoverage, sourceLines, branchStats);
  promoteCoveredSmallFunctionStatementBodyLines(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteCoveredMultilineCallStarterLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteCoveredUncoveredMultilineCallStarterLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteCoveredSafeCallStarterLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  suppressFalseCoveredLinesInUncoveredWhenArms(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressUnselectedInlineWhenArmLines(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressFalseCoveredLinesInUncoveredBranches(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressFalseCoveredLinesInUncoveredFunctions(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressTerminalCatchNullCoverageNoise(lineCoverage, filePath, sourceLines);
  suppressWhenTryCatchFallbackReturnNoise(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressChainedTryFallbackReturnNoise(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressSuspiciousBlockFunctionHeaderLineCounts(fileCoverage, lineCoverage, sourceLines);
  suppressSuspiciousPropertyDeclarationHeadLineCounts(fileCoverage, lineCoverage, sourceLines);
  suppressSuspiciousInitializedPropertyHeaderLineCounts(fileCoverage, lineCoverage, sourceLines);
  suppressPromotedLinesInUncoveredCatchBlocks(fileCoverage, lineCoverage, filePath, sourceLines);

  // When statementMap is empty (MCR sourcemap remap produced no statements for this file),
  // but fnMap has covered functions, derive line coverage from function loc ranges.
  // This handles cases like expression-body functions in object declarations where
  // MCR only generates fnMap entries but no statements.
  applyFunctionCoverageFallback(fileCoverage, lineCoverage, filePath, sourceLines);
  hardSuppressZeroCountLambdaListenerBodies(fileCoverage, lineCoverage, filePath, sourceLines);

  return lineCoverage;
}

function applyFunctionCoverageFallback(fileCoverage, lineCoverage, filePath, sourceLines) {
  // Only apply when statementMap is empty or has very few entries —
  // this is a fallback for files where MCR's sourcemap remap produced
  // function mappings but no statement mappings.
  const stmtCount = Object.keys(fileCoverage.statementMap || {}).length;
  if (stmtCount > 0) {
    return;
  }

  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    const count = Number(fileCoverage.f?.[functionId] || 0);
    if (count <= 0) {
      continue;
    }

    // Use the function's loc (actual code range) to derive line coverage.
    // Skip lines that are structural-neutral (function signatures, etc.).
    const loc = functionCoverage.loc;
    if (!loc?.start?.line || !loc?.end?.line) {
      continue;
    }

    const executableLines = getExecutableLines(loc, filePath, sourceLines);
    for (const lineNumber of executableLines) {
      if (lineCoverage[lineNumber] == null || count > lineCoverage[lineNumber]) {
        lineCoverage[lineNumber] = count;
      }
    }
  }
}

function hardSuppressZeroCountLambdaListenerBodies(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    if (Number(fileCoverage.f?.[functionId] || 0) > 0) {
      continue;
    }

    const startLine = Number(functionCoverage?.loc?.start?.line || 0);
    const endLine = Number(functionCoverage?.loc?.end?.line || 0);
    if (!startLine || !endLine || endLine < startLine) {
      continue;
    }

    const headerText = getLineText(sourceLines, startLine).trim();
    if (/\bfun\b/u.test(headerText)) {
      continue;
    }

    const hardSuppressedRange = findInnermostHardSuppressedZeroCountLambdaRange(fileCoverage, sourceLines, startLine);
    if (!hardSuppressedRange || hardSuppressedRange.functionId !== functionId) {
      continue;
    }

    const executableLines = getExecutableLinesInRange(filePath, sourceLines, startLine, endLine);
    executableLines.forEach((lineNumber) => {
      if (Number(lineCoverage[lineNumber]) > 0) {
        lineCoverage[lineNumber] = 0;
      }
    });
  }
}

function getReportRelativeSourcePath(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const projectScopedIndex = scopeRootAnchor ? normalizedPath.indexOf(scopeRootAnchor) : -1;
  return projectScopedIndex === -1
    ? normalizedPath
    : normalizedPath.slice(projectScopedIndex + scopeRootAnchor.length);
}

function markBranchLineStatus(branchStats, lineNumber, covered) {
  if (!lineNumber || lineNumber < 1) {
    return;
  }

  const current = branchStats.get(lineNumber) || { covered: 0, uncovered: 0 };
  if (covered) {
    current.covered += 1;
  } else {
    current.uncovered += 1;
  }
  branchStats.set(lineNumber, current);
}

function isSimpleControlFlowLine(lineText) {
  return /\b(?:if|else|when|for|while|do|try|catch|finally)\b/u.test(lineText.trim());
}

function isPartialControlLine(lineText) {
  return partialControlLinePattern.test(lineText.trim());
}

function isBranchHeaderLikeLine(lineText) {
  const trimmed = lineText.trim();
  const normalized = trimmed.replace(/^(?:\}\s*)+/u, '');
  const arrowIndex = normalized.indexOf('->');
  const openBraceIndex = normalized.indexOf('{');
  const looksLikeWhenArm = arrowIndex >= 0 && (openBraceIndex === -1 || arrowIndex < openBraceIndex);
  return looksLikeWhenArm || /^(?:if|else\b|when\b|catch\b|finally\b|try\b)/u.test(normalized);
}

function getLineCoverageCount(fileCoverage, lineNumber) {
  const rawCount = fileCoverage.l?.[lineNumber] ?? fileCoverage.l?.[String(lineNumber)];
  if (rawCount == null) {
    return null;
  }
  return Number(rawCount);
}

function shouldPromoteSimpleFunctionSignatureLine(lineCoverage, signatureLine, bodyLines) {
  return lineCoverage[signatureLine] === 0
    && bodyLines.every((lineNumber) => Number(lineCoverage[lineNumber]) > 0);
}

function getTopLevelExecutableLinesInFunctionRange(filePath, sourceLines, startLine, endLine) {
  const topLevelLines = [];
  let depth = 1;

  for (let cursor = startLine + 1; cursor < endLine; cursor += 1) {
    const text = getLineText(sourceLines, cursor);
    if (!isForceNeutralLine(filePath, sourceLines, cursor) && depth === 1) {
      topLevelLines.push(cursor);
    }

    for (const ch of text) {
      if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
      }
    }
  }

  return topLevelLines;
}

function getPromotableObjectWrapperLine(lineCoverage, filePath, sourceLines, signatureLine, endLine, branchStats) {
  if (lineCoverage[signatureLine] !== 0 || branchStats.has(signatureLine)) {
    return null;
  }

  const topLevelLines = getTopLevelExecutableLinesInFunctionRange(filePath, sourceLines, signatureLine, endLine);
  if (topLevelLines.length !== 1) {
    return null;
  }

  const wrapperLine = topLevelLines[0];
  return /^return\s+object\b/u.test(getLineText(sourceLines, wrapperLine).trim())
    && Number(lineCoverage[wrapperLine]) > 0
    ? wrapperLine
    : null;
}

function findBlockEndLine(sourceLines, startLine) {
  let depth = 1;
  for (let cursor = startLine + 1; cursor <= sourceLines.length; cursor += 1) {
    const text = getLineText(sourceLines, cursor);
    for (const ch of text) {
      if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
      }
    }
    if (depth === 0) {
      return cursor;
    }
  }
  return startLine;
}

function findCatchBlockEndLine(sourceLines, catchLine) {
  return findBlockEndLine(sourceLines, catchLine);
}

function isLineInUncoveredCatchBlock(fileCoverage, filePath, sourceLines, lineNumber) {
  // Check if the line itself is a catch header line
  const currentText = getLineText(sourceLines, lineNumber).trim();
  if (/\bcatch\s*\(/u.test(currentText) && currentText.includes('{')) {
    const catchEndLine = findCatchBlockEndLine(sourceLines, lineNumber);
    const bodyLines = getExecutableLinesInRange(filePath, sourceLines, lineNumber + 1, catchEndLine - 1);
    return !catchBlockHasRealExecution(fileCoverage, lineNumber, bodyLines);
  }

  for (let cursor = lineNumber - 1; cursor >= 1; cursor -= 1) {
    const text = getLineText(sourceLines, cursor).trim();
    if (!text || /^(?:\/\/|\/\*|\*|\*\/)/u.test(text)) {
      continue;
    }
    if (/\bcatch\s*\(/u.test(text) && text.includes('{')) {
      const catchEndLine = findCatchBlockEndLine(sourceLines, cursor);
      if (cursor <= lineNumber && lineNumber <= catchEndLine) {
        const bodyLines = getExecutableLinesInRange(filePath, sourceLines, cursor + 1, catchEndLine - 1);
        return !catchBlockHasRealExecution(fileCoverage, cursor, bodyLines);
      }
      return false;
    }
    if (/\bfun\b/u.test(text) || /\bclass\b/u.test(text)) {
      break;
    }
  }
  return false;
}

/**
 * Determine whether a catch block was truly executed.
 * We rely on direct statement coverage: if any line in the catch block has
 * a covered statement that starts AND ends on that line, the catch was
 * genuinely executed. Spanning statements (e.g. `return try { ... } catch { ... }`)
 * cross catch boundaries but only reflect the try-path execution.
 */
function catchBlockHasRealExecution(fileCoverage, catchHeaderLine, bodyLines) {
  const catchLines = [catchHeaderLine, ...bodyLines];
  return catchLines.some((line) => getDirectStatementCountOnLine(fileCoverage, line) > 0);
}

/**
 * Build a Set of all line numbers inside catch blocks that were NOT genuinely
 * executed. Used to prevent spanning statements from polluting fc.l for those
 * lines at the source, rather than cleaning up afterward.
 */
function buildUnexecutedCatchLineSet(fileCoverage, filePath, sourceLines) {
  const unexecutedLines = new Set();
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bcatch\s*\(/u.test(lineText) || !lineText.includes('{')) {
      continue;
    }

    const catchEndLine = findCatchBlockEndLine(sourceLines, lineNumber);
    const bodyLines = getExecutableLinesInRange(filePath, sourceLines, lineNumber + 1, catchEndLine - 1);
    if (catchBlockHasRealExecution(fileCoverage, lineNumber, bodyLines)) {
      continue;
    }

    unexecutedLines.add(lineNumber);
    bodyLines.forEach((line) => unexecutedLines.add(line));
  }
  return unexecutedLines;
}

function suppressPromotedLinesInUncoveredCatchBlocks(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bcatch\s*\(/u.test(lineText) || !lineText.includes('{')) {
      continue;
    }

    const catchEndLine = findCatchBlockEndLine(sourceLines, lineNumber);
    const bodyLines = getExecutableLinesInRange(filePath, sourceLines, lineNumber + 1, catchEndLine - 1);
    if (catchBlockHasRealExecution(fileCoverage, lineNumber, bodyLines)) {
      continue;
    }

    // Catch block never executed — reset all promoted coverage back to 0
    // for lines that have no direct statement coverage of their own.
    const catchLines = [lineNumber, ...bodyLines];
    catchLines.forEach((line) => {
      if (Number(lineCoverage[line]) > 0 && !getDirectStatementCountOnLine(fileCoverage, line)) {
        lineCoverage[line] = 0;
      }
    });
  }
}

function getExecutableLinesInRange(filePath, sourceLines, startLine, endLine) {
  const executableLines = [];
  for (let cursor = startLine; cursor <= endLine; cursor += 1) {
    if (!isForceNeutralLine(filePath, sourceLines, cursor)) {
      executableLines.push(cursor);
    }
  }
  return executableLines;
}

function getDirectStatementCountOnLine(fileCoverage, lineNumber) {
  let maxCount = null;
  for (const [statementId, loc] of Object.entries(fileCoverage.statementMap || {})) {
    if (loc?.start?.line !== lineNumber || loc?.end?.line !== lineNumber) {
      continue;
    }
    const count = Number(fileCoverage.s?.[statementId] || 0);
    if (maxCount == null || count > maxCount) {
      maxCount = count;
    }
  }
  return maxCount;
}

function getCoveredSpanningStatementCountsStartingOnLine(fileCoverage, lineNumber) {
  return Object.entries(fileCoverage.statementMap || {})
    .filter(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
      && loc?.start?.line === lineNumber
      && Number(loc?.end?.line || lineNumber) > lineNumber)
    .map(([statementId]) => Number(fileCoverage.s?.[statementId] || 0));
}

function getCoveredSpanningStatementCountsEndingOnLine(fileCoverage, lineNumber) {
  return Object.entries(fileCoverage.statementMap || {})
    .filter(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
      && Number(loc?.start?.line || 0) < lineNumber
      && loc?.end?.line === lineNumber)
    .map(([statementId]) => Number(fileCoverage.s?.[statementId] || 0));
}

function suppressSuspiciousBlockFunctionHeaderLineCounts(fileCoverage, lineCoverage, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const headerText = getLineText(sourceLines, lineNumber);
    if (!isBlockFunctionHeaderLine(headerText) || !(Number(lineCoverage[lineNumber]) > 0)) {
      continue;
    }

    const endLine = findBlockEndLine(sourceLines, lineNumber);
    if (endLine <= lineNumber) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (directStatementCount > 0) {
      lineCoverage[lineNumber] = directStatementCount;
      continue;
    }

    delete lineCoverage[lineNumber];
  }
}

function suppressSuspiciousPropertyDeclarationHeadLineCounts(fileCoverage, lineCoverage, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber);
    if (!isPropertyDeclarationHeaderLine(lineText) || !(Number(lineCoverage[lineNumber]) > 0)) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (directStatementCount > 0) {
      lineCoverage[lineNumber] = directStatementCount;
      continue;
    }

    delete lineCoverage[lineNumber];
  }
}

function suppressSuspiciousInitializedPropertyHeaderLineCounts(fileCoverage, lineCoverage, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber);
    if (!isMultilineInitializedPropertyHeaderLine(lineText) || !(Number(lineCoverage[lineNumber]) > 0)) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (directStatementCount > 0) {
      lineCoverage[lineNumber] = directStatementCount;
      continue;
    }

    if (isMultilineLambdaInitializedPropertyHeaderLine(sourceLines, lineNumber)) {
      delete lineCoverage[lineNumber];
      continue;
    }

    if (!hasCoveredSpanningStatementStartingOnLine(fileCoverage, lineNumber)) {
      continue;
    }

    delete lineCoverage[lineNumber];
  }
}

function promoteDirectCoveredBranchBodyLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (const [branchId, branchCoverage] of Object.entries(fileCoverage.branchMap || {})) {
    const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];
    const locations = Array.isArray(branchCoverage?.locations) ? branchCoverage.locations : [];
    locations.forEach((location, index) => {
      const executableLines = getExecutableLines(location, filePath, sourceLines);
      if (executableLines.length < 2) {
        return;
      }

      const branchHeaderLine = location?.start?.line;
      const bodyLines = executableLines.filter((lineNumber) => lineNumber !== branchHeaderLine);
      if (!bodyLines.length || bodyLines.length > 4) {
        return;
      }

      if (bodyLines.some((lineNumber) => isSimpleControlFlowLine(getLineText(sourceLines, lineNumber)))) {
        return;
      }

      const directCoveredCounts = bodyLines
        .map((lineNumber) => getDirectStatementCountOnLine(fileCoverage, lineNumber))
        .filter((count) => Number(count) > 0);
      const headerSpanningCounts = branchHeaderLine == null
        ? []
        : getCoveredSpanningStatementCountsStartingOnLine(fileCoverage, branchHeaderLine);
      const branchCount = Number(branchCounts[index] || 0);
      if (!directCoveredCounts.length && !headerSpanningCounts.length && branchCount <= 0) {
        return;
      }

      const fallbackCount = Math.max(branchCount, ...directCoveredCounts, ...headerSpanningCounts);
      bodyLines.forEach((lineNumber) => {
        const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
        if (!(Number(lineCoverage[lineNumber]) > 0) && (directStatementCount == null || directStatementCount === 0)) {
          lineCoverage[lineNumber] = fallbackCount;
        }
      });
    });
  }
}

function suppressFalseCoveredLinesInUncoveredBranches(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (const [branchId, branchCoverage] of Object.entries(fileCoverage.branchMap || {})) {
    const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];
    const locations = Array.isArray(branchCoverage?.locations) ? branchCoverage.locations : [];
    locations.forEach((location, index) => {
      const branchCount = Number(branchCounts[index] || 0);
      if (branchCount > 0) {
        return;
      }

      const executableLines = getExecutableLines(location, filePath, sourceLines);
      if (!executableLines.length || executableLines.length > 60) {
        return;
      }

      const normalizedHeaderLine = executableLines.find((lineNumber) => isBranchHeaderLikeLine(getLineText(sourceLines, lineNumber)));
      const candidateLines = normalizedHeaderLine == null
        ? executableLines
        : executableLines.filter((lineNumber) => lineNumber >= normalizedHeaderLine);
      if (!candidateLines.length) {
        return;
      }

      const branchHeaderLine = candidateLines[0];
      const branchHeaderText = getLineText(sourceLines, branchHeaderLine);
      const bodyLines = candidateLines.filter((lineNumber) => lineNumber !== branchHeaderLine);
      if (!bodyLines.length && !isPartialControlLine(branchHeaderText)) {
        return;
      }

      if (bodyLines.length === 1) {
        const [bodyLine] = bodyLines;
        const directBodyStatementCount = getDirectStatementCountOnLine(fileCoverage, bodyLine);
        if ((directBodyStatementCount == null || directBodyStatementCount === 0)
          && !hasReliableCoveredExecutionContainedInRange(fileCoverage, bodyLine, location?.end?.line, null)) {
          if (Number(lineCoverage[bodyLine]) > 0) {
            lineCoverage[bodyLine] = 0;
          }
          return;
        }
      }

      if (hasReliableCoveredExecutionContainedInRange(fileCoverage, branchHeaderLine, location?.end?.line, null)) {
        return;
      }

      candidateLines.forEach((lineNumber) => {
        const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
        if (Number(lineCoverage[lineNumber]) > 0 && (directStatementCount == null || directStatementCount === 0)) {
          lineCoverage[lineNumber] = 0;
        }
      });
    });
  }
}

function promoteSimpleLambdaBodyCoverage(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    const count = Number(fileCoverage.f?.[functionId] || 0);
    const declStartLine = functionCoverage?.decl?.start?.line;
    const locStartLine = functionCoverage?.loc?.start?.line;
    const locEndLine = functionCoverage?.loc?.end?.line;
    if (!declStartLine || !locStartLine || !locEndLine || locEndLine <= locStartLine) {
      continue;
    }

    if (/\bfun\b/u.test(getLineText(sourceLines, declStartLine))) {
      continue;
    }

    const bodyLines = getTopLevelExecutableLinesInFunctionRange(filePath, sourceLines, locStartLine, locEndLine);
    if (!bodyLines.length || bodyLines.length > 6) {
      continue;
    }

    const promotableBodyLines = bodyLines.filter((lineNumber) => !isSimpleControlFlowLine(getLineText(sourceLines, lineNumber)));
    if (!promotableBodyLines.length) {
      continue;
    }

    const coveredCounts = promotableBodyLines
      .map((lineNumber) => lineCoverage[lineNumber])
      .filter((lineValue) => Number(lineValue) > 0);
    if (!coveredCounts.length && count <= 0) {
      continue;
    }

    const fallbackCount = coveredCounts.length ? Math.max(count, ...coveredCounts) : count;
    promotableBodyLines.forEach((lineNumber) => {
      const lineText = getLineText(sourceLines, lineNumber);
      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
      if (!(Number(lineCoverage[lineNumber]) > 0)
        && (directStatementCount == null || directStatementCount === 0)
        && (!branchStats.has(lineNumber) || !isPartialControlLine(lineText))) {
        lineCoverage[lineNumber] = fallbackCount;
      }
    });
  }
}


function promoteClosureBodyCoverage(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  // Promote lines inside scope functions (.let {}, .apply {}, .run {}, .also {}, .with {})
  // when the closure itself has been executed
  
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber).trim();
    
    // Detect scope function call with opening brace: .let { or ?.let { etc.
    if (!/(?:\?\.)?(let|apply|run|also|with)\s*{\s*$/.test(lineText)) {
      continue;
    }
    
    // Find the closing brace of this scope function block
    const closingBraceLineNumber = findBlockEndLine(sourceLines, lineNumber);
    if (closingBraceLineNumber <= lineNumber) {
      continue;
    }
    
    // Check if any nested function in this block has coverage
    // If yes, the closure was executed and we can promote its body lines
    let hasExecutedNestedFunction = false;
    for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
      const funcCount = Number(fileCoverage.f?.[functionId] || 0);
      if (funcCount <= 0) {
        continue;
      }
      
      const funcStartLine = functionCoverage?.loc?.start?.line;
      const funcEndLine = functionCoverage?.loc?.end?.line;
      
      if (funcStartLine && funcEndLine && funcStartLine >= lineNumber && funcEndLine <= closingBraceLineNumber) {
        hasExecutedNestedFunction = true;
        break;
      }
    }
    
    if (!hasExecutedNestedFunction) {
      continue;
    }
    
    // Promote body lines between the braces
    const bodyLines = getTopLevelExecutableLinesInFunctionRange(filePath, sourceLines, lineNumber + 1, closingBraceLineNumber - 1);
    bodyLines.forEach((bodyLineNumber) => {
      const bodyLineText = getLineText(sourceLines, bodyLineNumber);
      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, bodyLineNumber);
      
      // Only promote if line is not already covered and has no direct statement count
      if (!(Number(lineCoverage[bodyLineNumber]) > 0)
        && (directStatementCount == null || directStatementCount === 0)
        && (!branchStats.has(bodyLineNumber) || !isPartialControlLine(bodyLineText))) {
        // Use 1 as the promotion count since we know the closure was executed
        lineCoverage[bodyLineNumber] = 1;
      }
    });
  }
}

function hasValidLineRange(loc) {
  const startLine = Number(loc?.start?.line || 0);
  const endLine = Number(loc?.end?.line || 0);
  return startLine > 0 && endLine > 0 && endLine >= startLine;
}

function hasDirectCoveredStatementContainedInRange(fileCoverage, startLine, endLine) {
  return Object.entries(fileCoverage.statementMap || {}).some(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
    && loc?.start?.line >= startLine
    && loc?.end?.line <= endLine
    && loc?.start?.line === loc?.end?.line);
}

function hasCoveredStatementContainedInRange(fileCoverage, startLine, endLine) {
  return Object.entries(fileCoverage.statementMap || {}).some(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
    && loc?.start?.line >= startLine
    && loc?.end?.line <= endLine
    && loc.start.line <= loc.end.line);
}

function hasCoveredBranchContainedInRange(fileCoverage, startLine, endLine) {
  return Object.entries(fileCoverage.branchMap || {}).some(([branchId, branchCoverage]) => {
    const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];
    const locations = Array.isArray(branchCoverage?.locations) ? branchCoverage.locations : [];
    return locations.some((location, index) => Number(branchCounts[index] || 0) > 0
      && location?.start?.line >= startLine
      && location?.end?.line <= endLine);
  });
}

function isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber) {
  return Object.entries(fileCoverage.branchMap || {}).some(([branchId, branchCoverage]) => {
    const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];
    const locations = Array.isArray(branchCoverage?.locations) ? branchCoverage.locations : [];
    // A branch has a covered arm if any count > 0 — the arm's location may be
    // undefined in sourcemap data (e.g. Kotlin/JS if-else where the else arm
    // has no explicit source location), but a positive count proves execution.
    const hasCoveredArm = branchCounts.some((count) => Number(count || 0) > 0);
    if (!hasCoveredArm) {
      return false;
    }

    return locations.some((location, index) => Number(branchCounts[index] || 0) === 0
      && location?.start?.line != null
      && location?.end?.line != null
      && location.start.line <= lineNumber
      && lineNumber <= location.end.line);
  });
}

function hasCoveredNestedFunctionContainedInRange(fileCoverage, startLine, endLine, excludedFunctionId) {
  const excludedLoc = fileCoverage.fnMap?.[excludedFunctionId]?.loc;
  return Object.entries(fileCoverage.fnMap || {}).some(([functionId, functionCoverage]) => {
    if (functionId === excludedFunctionId) {
      return false;
    }
    if (Number(fileCoverage.f?.[functionId] || 0) <= 0) {
      return false;
    }
    // Skip sibling functions that share the same loc start as the excluded
    // function — Kotlin/JS often generates multiple fnMap entries for the same
    // lambda (e.g. `lambda` and `lambda_1`, `lambda_0`). A covered sibling
    // does not prove the excluded function was independently called.
    // Only compare start (line+column) and end line — end column may differ
    // across sourcemap entries for the same lambda.
    if (excludedLoc
      && functionCoverage?.loc?.start?.line === excludedLoc.start?.line
      && functionCoverage?.loc?.start?.column === excludedLoc.start?.column
      && functionCoverage?.loc?.end?.line === excludedLoc.end?.line) {
      return false;
    }
    return functionCoverage?.loc?.start?.line >= startLine
      && functionCoverage?.loc?.end?.line <= endLine
      && functionCoverage?.loc?.start?.line <= functionCoverage?.loc?.end?.line;
  });
}

function hasReliableCoveredExecutionContainedInRange(fileCoverage, startLine, endLine, excludedFunctionId) {
  return hasDirectCoveredStatementContainedInRange(fileCoverage, startLine, endLine)
    || hasCoveredBranchContainedInRange(fileCoverage, startLine, endLine)
    || hasCoveredNestedFunctionContainedInRange(fileCoverage, startLine, endLine, excludedFunctionId);
}

function hasReliableCoveredInlineWhenArmExecution(fileCoverage, lineNumber) {
  return Number(getDirectStatementCountOnLine(fileCoverage, lineNumber) || 0) > 0
    || getCoveredSpanningStatementCountsStartingOnLine(fileCoverage, lineNumber).length > 0
    || getCoveredFunctionCountsContainingLine(fileCoverage, lineNumber).length > 0;
}

function isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!isInlineWhenArmLine(lineText)) {
    return false;
  }

  const whenRange = findEnclosingWhenBlockRange(sourceLines, lineNumber);
  if (!whenRange) {
    return false;
  }

  const siblingInlineArmLines = [];
  for (let cursor = whenRange.startLine + 1; cursor < whenRange.endLine; cursor += 1) {
    const candidateText = getLineText(sourceLines, cursor).trim();
    if (isInlineWhenArmLine(candidateText)) {
      siblingInlineArmLines.push(cursor);
    }
  }
  if (siblingInlineArmLines.length < 2) {
    return false;
  }

  const hasCoveredSibling = siblingInlineArmLines.some((cursor) => cursor !== lineNumber && hasReliableCoveredInlineWhenArmExecution(fileCoverage, cursor));
  if (!hasCoveredSibling) {
    return false;
  }

  return !hasReliableCoveredInlineWhenArmExecution(fileCoverage, lineNumber);
}

function hasCoveredExecutionOwnedByFunctionOnLine(fileCoverage, functionStartLine, functionEndLine, lineNumber, excludedFunctionId) {
  const hasCoveredStatementOnLine = Object.entries(fileCoverage.statementMap || {}).some(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
    && loc?.start?.line >= functionStartLine
    && loc?.end?.line <= functionEndLine
    && loc?.start?.line <= lineNumber
    && lineNumber <= loc?.end?.line);
  if (hasCoveredStatementOnLine) {
    return true;
  }

  const hasCoveredBranchOnLine = Object.entries(fileCoverage.branchMap || {}).some(([branchId, branchCoverage]) => {
    const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];
    if (branchCoverage?.line === lineNumber
      && branchCoverage.line >= functionStartLine
      && branchCoverage.line <= functionEndLine
      && branchCounts.some((count) => Number(count || 0) > 0)) {
      return true;
    }

    const locations = Array.isArray(branchCoverage?.locations) ? branchCoverage.locations : [];
    return locations.some((location, index) => Number(branchCounts[index] || 0) > 0
      && location?.start?.line >= functionStartLine
      && location?.end?.line <= functionEndLine
      && location?.start?.line <= lineNumber
      && lineNumber <= location?.end?.line);
  });
  if (hasCoveredBranchOnLine) {
    return true;
  }

  return Object.entries(fileCoverage.fnMap || {}).some(([functionId, functionCoverage]) => functionId !== excludedFunctionId
    && Number(fileCoverage.f?.[functionId] || 0) > 0
    && functionCoverage?.loc?.start?.line >= functionStartLine
    && functionCoverage?.loc?.end?.line <= functionEndLine
    && functionCoverage?.loc?.start?.line <= lineNumber
    && lineNumber <= functionCoverage?.loc?.end?.line);
}

function suppressFalseCoveredLinesInUncoveredFunctions(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    const count = Number(fileCoverage.f?.[functionId] || 0);
    const locStartLine = functionCoverage?.loc?.start?.line;
    const locEndLine = functionCoverage?.loc?.end?.line;
    if (count > 0 || !locStartLine || !locEndLine || locEndLine < locStartLine) {
      continue;
    }

    // Determine the function's header start line.
    // For lambda/anonymous functions (no 'fun' keyword on their loc start line),
    // use the lambda's own loc range — expanding to the enclosing function would
    // incorrectly include sibling lambdas' covered statements in the range check.
    const locHeaderText = getLineText(sourceLines, locStartLine);
    const isLambdaLikeFunction = !/\bfun\b/u.test(locHeaderText);

    let headerStartLine;
    let functionEndLine;

    if (isLambdaLikeFunction) {
      headerStartLine = locStartLine;
      functionEndLine = locEndLine;
    } else {
      headerStartLine = findFunctionHeaderStartLine(sourceLines, locStartLine) || locStartLine;
      // Use locEndLine instead of findBlockEndLine: the loc range from
      // Istanbul/V8 covers the full function including nested lambdas and
      // classes, whereas findBlockEndLine may stop at the first matching
      // closing brace (the direct method body), missing nested scopes.
      functionEndLine = locEndLine;
    }

    if (functionEndLine < headerStartLine) {
      continue;
    }

    const headerText = getLineText(sourceLines, headerStartLine);
    const isTopLevelZeroCountLambda = isLambdaLikeFunction && !findEnclosingBlockFunctionRange(sourceLines, headerStartLine - 1);
    // Determine hasLocalCoveredExecution:
    // Covered statements within an uncovered function's range are unreliable
    // evidence of local execution — they often come from a spanning statement
    // originating outside the function (e.g. Kotlin/JS object initializers).
    // Only a nested covered function (not a sibling with the same loc) reliably
    // proves the function was called.
    // For object literals (object : SomeType { ... }), nested methods don't indicate
    // the object was instantiated. So we don't use hasLocalCoveredExecution to skip
    // suppression for object literals.
    const isObjectLiteral = isObjectLiteralConstructor(headerText);
    const hasLocalCoveredExecution = !isObjectLiteral && hasCoveredNestedFunctionContainedInRange(fileCoverage, headerStartLine, functionEndLine, functionId);
    if (hasLocalCoveredExecution) {
      continue;
    }


    const executableLines = getExecutableLinesInRange(filePath, sourceLines, headerStartLine, functionEndLine);
    executableLines.forEach((lineNumber) => {
      if (!(Number(lineCoverage[lineNumber]) > 0)) {
        return;
      }
      // When hasLocalCoveredExecution is false, no covered nested function exists
      // within the range — the function was never called. All line coverage inside
      // is from spanning statements originating outside the function, so suppress
      // unconditionally without checking directStatementCount or owned execution.
      if (!hasLocalCoveredExecution) {
        lineCoverage[lineNumber] = 0;
        return;
      }
      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
      if (directStatementCount != null && directStatementCount > 0) {
        return;
      }
      // Suppress control-flow header lines (when-arms, if conditions) in uncovered functions
      const lineText = getLineText(sourceLines, lineNumber);
      if (isControlFlowHeaderLine(lineText)) {
        lineCoverage[lineNumber] = 0;
        return;
      }
      if (isTopLevelZeroCountLambda && lineNumber === headerStartLine) {
        return;
      }
      if (hasCoveredExecutionOwnedByFunctionOnLine(fileCoverage, headerStartLine, functionEndLine, lineNumber, functionId)) {
        return;
      }
      lineCoverage[lineNumber] = 0;
    });
  }
}

function suppressFalseCoveredLinesInFunctionsWithoutLocalExecution(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const headerText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bfun\b/u.test(headerText) || !headerText.includes('{')) {
      continue;
    }

    const functionEndLine = findBlockEndLine(sourceLines, lineNumber);
    if (functionEndLine <= lineNumber) {
      continue;
    }

    const hasLocalCoveredExecution = hasCoveredStatementContainedInRange(fileCoverage, lineNumber, functionEndLine)
      || hasCoveredNestedFunctionContainedInRange(fileCoverage, lineNumber, functionEndLine, null)
      || hasCoveredSpanningStatementStartingOnLine(fileCoverage, lineNumber);
    if (hasLocalCoveredExecution) {
      lineNumber = functionEndLine;
      continue;
    }

    const executableLines = getExecutableLinesInRange(filePath, sourceLines, lineNumber, functionEndLine);
    executableLines.forEach((candidate) => {
      if (!(Number(lineCoverage[candidate]) > 0)) {
        return;
      }
      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, candidate);
      if (directStatementCount != null && directStatementCount > 0) {
        return;
      }
      if (hasCoveredExecutionOwnedByFunctionOnLine(fileCoverage, lineNumber, functionEndLine, candidate, null)) {
        return;
      }
      lineCoverage[candidate] = 0;
    });

    lineNumber = functionEndLine;
  }
}

function cleanupFalseCoveredLinesInFunctionsWithoutLocalExecution(fileCoverage, filePath, sourceLines) {
  if (!fileCoverage.l) {
    return;
  }

  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const headerText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bfun\b/u.test(headerText) || !headerText.includes('{')) {
      continue;
    }

    const functionEndLine = findBlockEndLine(sourceLines, lineNumber);
    if (functionEndLine <= lineNumber) {
      continue;
    }

    const hasLocalCoveredExecution = hasCoveredStatementContainedInRange(fileCoverage, lineNumber, functionEndLine)
      || hasCoveredNestedFunctionContainedInRange(fileCoverage, lineNumber, functionEndLine, null)
      || hasCoveredSpanningStatementStartingOnLine(fileCoverage, lineNumber);
    if (hasLocalCoveredExecution) {
      lineNumber = functionEndLine;
      continue;
    }

    const executableLines = getExecutableLinesInRange(filePath, sourceLines, lineNumber, functionEndLine);
    executableLines.forEach((candidate) => {
      const currentCount = getLineCoverageCount(fileCoverage, candidate);
      if (!(Number(currentCount) > 0)) {
        return;
      }
      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, candidate);
      if (directStatementCount != null && directStatementCount > 0) {
        return;
      }
      if (hasCoveredExecutionOwnedByFunctionOnLine(fileCoverage, lineNumber, functionEndLine, candidate, null)) {
        return;
      }
      fileCoverage.l[candidate] = 0;
    });

    lineNumber = functionEndLine;
  }
}

function suppressFalseCoveredWhenElseTailLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const whenText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bwhen\s*\{\s*$/u.test(whenText)) {
      continue;
    }

    const endLine = findBlockEndLine(sourceLines, lineNumber);
    if (endLine <= lineNumber + 1) {
      continue;
    }

    const armLines = [];
    for (let cursor = lineNumber + 1; cursor < endLine; cursor += 1) {
      const armText = getLineText(sourceLines, cursor).trim();
      if (!/->/u.test(armText) || armText.includes('{')) {
        continue;
      }
      armLines.push(cursor);
    }

    const elseLine = armLines.find((cursor) => /^else\s*->/u.test(getLineText(sourceLines, cursor).trim()));
    if (!elseLine || !(Number(lineCoverage[elseLine]) > 0)) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, elseLine);
    if (directStatementCount != null && directStatementCount > 0) {
      continue;
    }

    const coveredNonElseArmLines = armLines.filter((cursor) => cursor !== elseLine && Number(lineCoverage[cursor]) > 0);
    if (coveredNonElseArmLines.length !== 1) {
      continue;
    }

    const coveredArmLine = coveredNonElseArmLines[0];
    if (Number(lineCoverage[coveredArmLine]) !== Number(lineCoverage[elseLine])) {
      continue;
    }

    const trailingSiblingArms = armLines.filter((cursor) => coveredArmLine < cursor && cursor < elseLine);
    if (trailingSiblingArms.some((cursor) => Number(lineCoverage[cursor]) > 0)) {
      continue;
    }

    lineCoverage[elseLine] = 0;
  }
}

function suppressFalseCoveredLinesInUncoveredWhenArms(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const whenText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bwhen\b[\s\S]*\{\s*$/u.test(whenText)) {
      continue;
    }

    const whenEndLine = findBlockEndLine(sourceLines, lineNumber);
    if (whenEndLine <= lineNumber + 1) {
      continue;
    }

    for (let cursor = lineNumber + 1; cursor < whenEndLine; cursor += 1) {
      const armText = getLineText(sourceLines, cursor).trim();
      if (!/->\s*\{\s*$/u.test(armText)) {
        continue;
      }

      const armEndLine = findBlockEndLine(sourceLines, cursor);
      if (armEndLine <= cursor + 1) {
        cursor = armEndLine;
        continue;
      }

      const executableLines = getExecutableLinesInRange(filePath, sourceLines, cursor, armEndLine);
      const coveredLines = executableLines.filter((line) => Number(lineCoverage[line]) > 0);
      const uncoveredLines = executableLines.filter((line) => lineCoverage[line] === 0);
      if (!coveredLines.length || !uncoveredLines.length) {
        cursor = armEndLine;
        continue;
      }

      const hasCoveredExecutionInArm = hasCoveredStatementContainedInRange(fileCoverage, cursor, armEndLine)
        || hasCoveredBranchContainedInRange(fileCoverage, cursor, armEndLine)
        || hasCoveredNestedFunctionContainedInRange(fileCoverage, cursor, armEndLine, null);
      if (hasCoveredExecutionInArm) {
        cursor = armEndLine;
        continue;
      }

      coveredLines.forEach((line) => {
        const directStatementCount = getDirectStatementCountOnLine(fileCoverage, line);
        if (directStatementCount == null || directStatementCount === 0) {
          lineCoverage[line] = 0;
        }
      });
      cursor = armEndLine;
    }
  }
}

function suppressUnselectedInlineWhenArmLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    if (!isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (directStatementCount != null && directStatementCount > 0) {
      continue;
    }

    if (Number(lineCoverage[lineNumber]) > 0 || lineCoverage[lineNumber] == null) {
      lineCoverage[lineNumber] = 0;
    }
  }
}

function promoteCoveredWhenHeaderLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!/^when\b[\s\S]*\{\s*$/u.test(lineText)) {
      continue;
    }

    if (Number(lineCoverage[lineNumber]) > 0) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (directStatementCount != null && directStatementCount > 0) {
      continue;
    }

    const endLine = findBlockEndLine(sourceLines, lineNumber);
    if (endLine <= lineNumber + 1) {
      continue;
    }

    const coveredBodyCounts = getExecutableLinesInRange(filePath, sourceLines, lineNumber + 1, endLine - 1)
      .map((candidate) => lineCoverage[candidate])
      .filter((candidate) => Number(candidate) > 0);
    if (!coveredBodyCounts.length) {
      continue;
    }

    lineCoverage[lineNumber] = Math.max(...coveredBodyCounts);
    lineNumber = endLine;
  }
}

function promoteCoveredWhenArmHeaderLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const whenText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bwhen\b[\s\S]*\{\s*$/u.test(whenText)) {
      continue;
    }

    const whenEndLine = findBlockEndLine(sourceLines, lineNumber);
    if (whenEndLine <= lineNumber + 1) {
      continue;
    }

    for (let cursor = lineNumber + 1; cursor < whenEndLine; cursor += 1) {
      const armText = getLineText(sourceLines, cursor).trim();
      if (!/->\s*\{\s*$/u.test(armText)) {
        continue;
      }

      if (Number(lineCoverage[cursor]) > 0) {
        continue;
      }

      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, cursor);
      if (directStatementCount != null && directStatementCount > 0) {
        continue;
      }

      const armEndLine = findBlockEndLine(sourceLines, cursor);
      if (armEndLine <= cursor + 1) {
        continue;
      }

      const coveredBodyCounts = getExecutableLinesInRange(filePath, sourceLines, cursor + 1, armEndLine - 1)
        .map((candidate) => lineCoverage[candidate])
        .filter((candidate) => Number(candidate) > 0);
      const coveredArmStatementCounts = Object.entries(fileCoverage.statementMap || {})
        .filter(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
          && loc?.start?.line === cursor
          && Number(loc?.end?.line || cursor) > cursor)
        .map(([statementId]) => Number(fileCoverage.s?.[statementId] || 0));
      const promotionCounts = [...coveredBodyCounts, ...coveredArmStatementCounts];
      if (!promotionCounts.length) {
        continue;
      }

      lineCoverage[cursor] = Math.max(...promotionCounts);
      cursor = armEndLine;
    }
  }
}

function promoteCoveredLoopHeaderLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!(/\bforEach(?:Indexed)?\b[\s\S]*\{\s*(?:[^{}]+->\s*)?$/u.test(lineText)
      || /^for\s*\(.*\)\s*\{\s*$/u.test(lineText)
      || /^while\s*\(.*\)\s*\{\s*$/u.test(lineText))) {
      continue;
    }

    if (Number(lineCoverage[lineNumber]) > 0) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (directStatementCount != null && directStatementCount > 0) {
      continue;
    }

    const blockEndLine = findBlockEndLine(sourceLines, lineNumber);
    if (blockEndLine <= lineNumber + 1) {
      continue;
    }

    const coveredBodyCounts = getExecutableLinesInRange(filePath, sourceLines, lineNumber + 1, blockEndLine - 1)
      .map((candidate) => lineCoverage[candidate])
      .filter((candidate) => Number(candidate) > 0);
    if (!coveredBodyCounts.length) {
      continue;
    }

    lineCoverage[lineNumber] = Math.max(...coveredBodyCounts);
    lineNumber = blockEndLine;
  }
}

function promoteCoveredMultilineStatementLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (const [statementId, loc] of Object.entries(fileCoverage.statementMap || {})) {
    const count = Number(fileCoverage.s?.[statementId] || 0);
    if (count <= 0) {
      continue;
    }

    const startLine = loc?.start?.line;
    const endLine = loc?.end?.line;
    if (!startLine || !endLine || endLine <= startLine) {
      continue;
    }

    const executableLines = getExecutableLines(loc, filePath, sourceLines);
    if (executableLines.length < 2) {
      continue;
    }

    executableLines.slice(1).forEach((lineNumber) => {
      const lineText = getLineText(sourceLines, lineNumber).trim();
      if (!lineText
        || lineText.includes('->')
        || (branchStats.has(lineNumber) && !isMultilineControlConditionContinuationLine(sourceLines, lineNumber))
        || !isCoveredContinuationLine(sourceLines, lineNumber)) {
        return;
      }

      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
      if (directStatementCount != null && directStatementCount > 0) {
        return;
      }

      if (!(Number(lineCoverage[lineNumber]) > 0)) {
        lineCoverage[lineNumber] = count;
      }
    });
  }
}

function promoteCoveredMultilineStatementTailLines(fileCoverage, lineCoverage, sourceLines, branchStats) {
  const candidateEndLines = new Set(
    Object.entries(fileCoverage.statementMap || {})
      .filter(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
        && Number(loc?.end?.line || 0) > Number(loc?.start?.line || 0))
      .map(([, loc]) => Number(loc?.end?.line)),
  );

  candidateEndLines.forEach((endLine) => {
    const lineText = getLineText(sourceLines, endLine).trim();
    if (!lineText
      || /^(?:if|else\b|when\b|for\b|while\b|do\b|try\b|catch\b|finally\b)/u.test(lineText)
      || (branchStats.has(endLine) && isPartialControlLine(lineText))) {
      return;
    }

    const nextLine = findNextMeaningfulLineText(sourceLines, endLine, 3);
    if (!/^\}\s*(?:\?:|\.|\?\.|,|\))/u.test(nextLine)) {
      return;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, endLine);
    if (directStatementCount != null && directStatementCount > 0) {
      return;
    }

    const tailCounts = getCoveredSpanningStatementCountsEndingOnLine(fileCoverage, endLine);
    if (!tailCounts.length) {
      return;
    }

    if (!(Number(lineCoverage[endLine]) > 0)) {
      setLineCoverage(lineCoverage, endLine, Math.max(...tailCounts));
    }
  });
}

function promoteCoveredSmallFunctionStatementBodyLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (const [statementId, loc] of Object.entries(fileCoverage.statementMap || {})) {
    const count = Number(fileCoverage.s?.[statementId] || 0);
    if (count <= 0) {
      continue;
    }

    const startLine = loc?.start?.line;
    const endLine = loc?.end?.line;
    if (!startLine || !endLine || endLine <= startLine || endLine - startLine > 14) {
      continue;
    }

    const enclosingFunction = findEnclosingBlockFunctionRange(sourceLines, startLine);
    if (!enclosingFunction || endLine > enclosingFunction.endLine) {
      continue;
    }

    const executableLines = getExecutableLines(loc, filePath, sourceLines);
    if (executableLines.length < 2 || executableLines.length > 10) {
      continue;
    }

    executableLines.slice(1).forEach((lineNumber) => {
      if (Number(lineCoverage[lineNumber]) > 0) {
        return;
      }

      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
      if (directStatementCount != null && directStatementCount > 0) {
        return;
      }

      const lineText = getLineText(sourceLines, lineNumber).trim();
      if (!lineText || /^return@/u.test(lineText) || isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)) {
        return;
      }

      setLineCoverage(lineCoverage, lineNumber, count);
    });
  }
}

function promoteCoveredMultilineCallStarterLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (const [statementId, loc] of Object.entries(fileCoverage.statementMap || {})) {
    const count = Number(fileCoverage.s?.[statementId] || 0);
    if (count <= 0) {
      continue;
    }

    const executableLines = getExecutableLines(loc, filePath, sourceLines);
    if (executableLines.length < 2) {
      continue;
    }

    const startLine = executableLines[0];
    if (Number(lineCoverage[startLine]) > 0 || branchStats.has(startLine)) {
      continue;
    }

    const startText = getLineText(sourceLines, startLine).trim();
    if (!/[[(]\s*$/u.test(startText)) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, startLine);
    if (directStatementCount != null && directStatementCount > 0) {
      continue;
    }

    const coveredContinuationCounts = executableLines.slice(1)
      .filter((lineNumber) => !branchStats.has(lineNumber))
      .map((lineNumber) => lineCoverage[lineNumber])
      .filter((lineValue) => Number(lineValue) > 0);
    if (!coveredContinuationCounts.length) {
      continue;
    }

    lineCoverage[startLine] = Math.max(count, ...coveredContinuationCounts);
  }
}

function promoteCoveredUncoveredMultilineCallStarterLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    if (lineCoverage[lineNumber] !== 0 || branchStats.has(lineNumber)) {
      continue;
    }

    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!/[[(]\s*$/u.test(lineText)
      || /^(?:if|else\b|when\b|for\b|while\b|catch\b|return\b|throw\b)/u.test(lineText)
      || isBlockFunctionHeaderLine(lineText)
      || isPropertyDeclarationHeaderLine(lineText)
      || isMultilineInitializedPropertyHeaderLine(lineText)) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (directStatementCount != null && directStatementCount > 0) {
      continue;
    }

    const coveredContinuationCounts = [];
    for (let cursor = lineNumber + 1, maxLine = Math.min(sourceLines.length, lineNumber + 8); cursor <= maxLine; cursor += 1) {
      const candidateText = getLineText(sourceLines, cursor).trim();
      if (!candidateText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(candidateText)) {
        continue;
      }

      if (/^[)\]}]/u.test(candidateText)) {
        break;
      }

      if (!isCoveredContinuationLine(sourceLines, cursor)) {
        break;
      }

      if (!branchStats.has(cursor) && Number(lineCoverage[cursor]) > 0) {
        coveredContinuationCounts.push(Number(lineCoverage[cursor]));
      }
    }

    if (!coveredContinuationCounts.length) {
      continue;
    }

    lineCoverage[lineNumber] = Math.max(...coveredContinuationCounts);
  }
}

function promoteCoveredSafeCallStarterLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!/\?\.\s*[A-Za-z_][\w<>?]*\s*\(\s*$/u.test(lineText)) {
      continue;
    }

    if (Number(lineCoverage[lineNumber]) > 0) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    if (directStatementCount != null && directStatementCount > 0) {
      continue;
    }

    const coveredContinuationCounts = [];
    const maxLine = Math.min(sourceLines.length, lineNumber + 8);
    for (let cursor = lineNumber + 1; cursor <= maxLine; cursor += 1) {
      const candidateText = getLineText(sourceLines, cursor).trim();
      if (!candidateText) {
        continue;
      }
      if (/^\}/u.test(candidateText)) {
        break;
      }
      if (!branchStats.has(cursor) && !isForceNeutralLine(filePath, sourceLines, cursor) && Number(lineCoverage[cursor]) > 0) {
        coveredContinuationCounts.push(lineCoverage[cursor]);
      }
      if (/^\)/u.test(candidateText)) {
        break;
      }
    }

    if (!coveredContinuationCounts.length) {
      continue;
    }

    lineCoverage[lineNumber] = Math.max(...coveredContinuationCounts);
  }
}

function suppressTerminalCatchNullCoverageNoise(lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber);
    if (!/\bcatch\s*\(/u.test(lineText) || !lineText.includes('{')) {
      continue;
    }

    const endLine = findCatchBlockEndLine(sourceLines, lineNumber);
    if (endLine <= lineNumber + 1) {
      continue;
    }

    const executableLines = getExecutableLinesInRange(filePath, sourceLines, lineNumber + 1, endLine - 1);
    if (executableLines.length < 2) {
      continue;
    }

    const terminalLine = executableLines[executableLines.length - 1];
    if (getLineText(sourceLines, terminalLine).trim() !== 'null') {
      continue;
    }

    if (!(Number(lineCoverage[terminalLine]) > 0)) {
      continue;
    }

    const earlierLines = executableLines.slice(0, -1);
    if (!earlierLines.some((cursor) => lineCoverage[cursor] === 0)) {
      continue;
    }

    if (earlierLines.some((cursor) => Number(lineCoverage[cursor]) > 0)) {
      continue;
    }

    lineCoverage[terminalLine] = 0;
  }
}

function suppressWhenTryCatchFallbackReturnNoise(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    if (!(Number(lineCoverage[lineNumber]) > 0)) {
      continue;
    }

    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (lineText !== 'return null') {
      continue;
    }

    let whenLine = 0;
    for (let cursor = lineNumber - 1; cursor >= 1; cursor -= 1) {
      const text = getLineText(sourceLines, cursor).trim();
      if (!text) {
        continue;
      }
      if (/\bwhen\s*\(/u.test(text)) {
        whenLine = cursor;
        break;
      }
      if (/\bfun\b/u.test(text)) {
        break;
      }
    }
    if (!whenLine) {
      continue;
    }

    const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
    let shouldSuppress = directStatementCount === 0;

    for (let cursor = whenLine + 1; cursor < lineNumber; cursor += 1) {
      const text = getLineText(sourceLines, cursor).trim();
      if (!/->\s*\{/u.test(text)) {
        continue;
      }
      const branchEndLine = findBlockEndLine(sourceLines, cursor);
      if (branchEndLine >= lineNumber) {
        continue;
      }
      const branchExecutableLines = getExecutableLinesInRange(filePath, sourceLines, cursor, branchEndLine);
      const branchHasTryCatch = branchExecutableLines.some((candidate) => /\btry\b/u.test(getLineText(sourceLines, candidate)))
        && branchExecutableLines.some((candidate) => /\bcatch\s*\(/u.test(getLineText(sourceLines, candidate)));
      if (!branchHasTryCatch) {
        cursor = branchEndLine;
        continue;
      }

      const innerExecutableLines = branchExecutableLines.filter((candidate) => candidate !== cursor);
      const hasUncoveredExecutable = innerExecutableLines.some((candidate) => lineCoverage[candidate] === 0);
      const hasCoveredExecutable = innerExecutableLines.some((candidate) => Number(lineCoverage[candidate]) > 0);
      const branchLineCount = Number(lineCoverage[cursor] || 0);
      if (hasUncoveredExecutable && !hasCoveredExecutable && branchLineCount > 0 && branchLineCount === Number(lineCoverage[lineNumber])) {
        shouldSuppress = true;
      }
      cursor = branchEndLine;
    }

    if (shouldSuppress) {
      lineCoverage[lineNumber] = 0;
    }
  }
}

function suppressChainedTryFallbackReturnNoise(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    if (!(Number(lineCoverage[lineNumber]) > 0)) {
      continue;
    }

    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!/^return\b/u.test(lineText) || lineText === 'return null') {
      continue;
    }

    if (getDirectStatementCountOnLine(fileCoverage, lineNumber) !== 0) {
      continue;
    }

    const tryLines = [];
    const catchLines = [];
    for (let cursor = Math.max(1, lineNumber - 30); cursor < lineNumber; cursor += 1) {
      const text = getLineText(sourceLines, cursor).trim();
      if (/^try\s*\{/u.test(text)) {
        tryLines.push(cursor);
      }
      if (/\bcatch\s*\(/u.test(text) && text.includes('{')) {
        catchLines.push(cursor);
      }
    }

    if (tryLines.length < 2 || catchLines.length < 2) {
      continue;
    }

    const hasCoveredCatchBody = catchLines.some((catchLine) => {
      const endLine = findCatchBlockEndLine(sourceLines, catchLine);
      return getExecutableLinesInRange(filePath, sourceLines, catchLine + 1, endLine - 1)
        .some((candidate) => Number(lineCoverage[candidate]) > 0);
    });
    if (hasCoveredCatchBody) {
      continue;
    }

    lineCoverage[lineNumber] = 0;
  }
}

function propagateCoveredBranchBodyLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (const [branchId, branchCoverage] of Object.entries(fileCoverage.branchMap || {})) {
    const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];
    const locations = Array.isArray(branchCoverage?.locations) ? branchCoverage.locations : [];
    locations.forEach((location, index) => {
      const count = Number(branchCounts[index] || 0);
      if (count <= 0) {
        return;
      }

      const executableLines = getExecutableLines(location, filePath, sourceLines);
      if (executableLines.length !== 2) {
        return;
      }

      const branchHeaderLine = location?.start?.line;
      const bodyLine = executableLines.find((lineNumber) => lineNumber !== branchHeaderLine);
      if (!bodyLine) {
        return;
      }

      if (lineCoverage[bodyLine] == null || lineCoverage[bodyLine] === 0) {
        lineCoverage[bodyLine] = count;
      }
    });
  }
}

function findFunctionHeaderStartLine(sourceLines, startLine) {
  const minLine = Math.max(1, startLine - 8);
  for (let lineNumber = startLine; lineNumber >= minLine; lineNumber -= 1) {
    const lineText = getLineText(sourceLines, lineNumber);
    if (/\bfun\b/u.test(lineText)) {
      return lineNumber;
    }
  }
  return null;
}

function findFunctionSignatureEndLine(sourceLines, headerStartLine, openLineHint) {
  const maxLine = Math.max(headerStartLine, openLineHint || headerStartLine);
  for (let lineNumber = headerStartLine; lineNumber <= maxLine; lineNumber += 1) {
    if (getLineText(sourceLines, lineNumber).includes('{')) {
      return lineNumber;
    }
  }
  return headerStartLine;
}

function alignFunctionHeaderCoverageWithBody(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    const count = Number(fileCoverage.f?.[functionId] || 0);
    const locStartLine = functionCoverage?.loc?.start?.line;
    const locEndLine = functionCoverage?.loc?.end?.line;
    if (!locStartLine || !locEndLine || locEndLine < locStartLine) {
      continue;
    }

    const headerStartLine = findFunctionHeaderStartLine(sourceLines, locStartLine);
    if (!headerStartLine) {
      continue;
    }

    const signatureEndLine = findFunctionSignatureEndLine(sourceLines, headerStartLine, locStartLine);
    const signatureLines = [];
    for (let lineNumber = headerStartLine; lineNumber <= signatureEndLine; lineNumber += 1) {
      if (!isForceNeutralLine(filePath, sourceLines, lineNumber)) {
        signatureLines.push(lineNumber);
      }
    }
    if (!signatureLines.length) {
      continue;
    }

    const bodyLines = getExecutableLinesInRange(filePath, sourceLines, signatureEndLine + 1, locEndLine);
    const coveredBodyCounts = bodyLines
      .map((lineNumber) => lineCoverage[lineNumber])
      .filter((lineValue) => Number(lineValue) > 0);

    if (coveredBodyCounts.length) {
      const fallbackCount = Math.max(count, ...coveredBodyCounts);
      signatureLines.forEach((lineNumber) => {
        if (!(Number(lineCoverage[lineNumber]) > 0)) {
          lineCoverage[lineNumber] = fallbackCount;
        }
      });
      continue;
    }

    if (count === 0) {
      signatureLines.forEach((lineNumber) => {
        lineCoverage[lineNumber] = 0;
      });
    }
  }
}

function promoteCoveredTopLevelFunctionStatements(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const headerText = getLineText(sourceLines, lineNumber);
    if (!/\bfun\b/u.test(headerText) || !headerText.includes('{')) {
      continue;
    }

    let depth = 0;
    let endLine = lineNumber;
    let started = false;
    for (let cursor = lineNumber; cursor <= sourceLines.length; cursor += 1) {
      const text = getLineText(sourceLines, cursor);
      for (const ch of text) {
        if (ch === '{') {
          depth += 1;
          started = true;
        } else if (ch === '}') {
          depth -= 1;
        }
      }
      if (started && depth === 0) {
        endLine = cursor;
        break;
      }
    }

    const topLevelLines = getTopLevelExecutableLinesInFunctionRange(filePath, sourceLines, lineNumber, endLine);
    const promotableTopLevelLines = topLevelLines.filter((candidate) => !branchStats.has(candidate));
    if (promotableTopLevelLines.length < 2 || promotableTopLevelLines.length > 6) {
      continue;
    }

    const coveredCounts = promotableTopLevelLines
      .map((candidate) => lineCoverage[candidate])
      .filter((lineValue) => Number(lineValue) > 0);
    if (!coveredCounts.length) {
      continue;
    }

    const fallbackCount = Math.max(...coveredCounts);
    promotableTopLevelLines.forEach((candidate) => {
      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, candidate);
      if (lineCoverage[candidate] === 0 && (directStatementCount == null || directStatementCount === 0)) {
        lineCoverage[candidate] = fallbackCount;
      }
    });
  }
}

function promoteCoveredBlockFunctionHeaderLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const headerText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bfun\b/u.test(headerText) || !headerText.includes('{')) {
      continue;
    }

    // Block function headers are structural neutral — skip promotion.
    if (isForceNeutralLine(filePath, sourceLines, lineNumber)) {
      continue;
    }

    if (Number(lineCoverage[lineNumber]) > 0) {
      continue;
    }

    const endLine = findBlockEndLine(sourceLines, lineNumber);
    if (endLine <= lineNumber + 1) {
      continue;
    }

    const topLevelLines = getTopLevelExecutableLinesInFunctionRange(filePath, sourceLines, lineNumber, endLine);
    const coveredCounts = topLevelLines
      .map((candidate) => lineCoverage[candidate])
      .filter((lineValue) => Number(lineValue) > 0);
    if (!coveredCounts.length) {
      continue;
    }

    setLineCoverage(lineCoverage, lineNumber, Math.max(...coveredCounts));
  }
}

function promoteCoveredAccessorHeaderLines(lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const headerText = getLineText(sourceLines, lineNumber).trim();
    if (!/^(?:get|set)\s*\([^)]*\)\s*\{\s*$/u.test(headerText)) {
      continue;
    }

    if (Number(lineCoverage[lineNumber]) > 0) {
      continue;
    }

    const endLine = findBlockEndLine(sourceLines, lineNumber);
    if (endLine <= lineNumber + 1) {
      continue;
    }

    const coveredCounts = getExecutableLinesInRange(filePath, sourceLines, lineNumber + 1, endLine - 1)
      .map((candidate) => lineCoverage[candidate])
      .filter((lineValue) => Number(lineValue) > 0);
    if (!coveredCounts.length) {
      continue;
    }

    setLineCoverage(lineCoverage, lineNumber, Math.max(...coveredCounts));
  }
}

function getFunctionCountsStartingOnLine(fileCoverage, lineNumber) {
  return Object.entries(fileCoverage.fnMap || {})
    .filter(([, functionCoverage]) => Number(functionCoverage?.line || 0) === lineNumber
      || Number(functionCoverage?.loc?.start?.line || 0) === lineNumber
      || Number(functionCoverage?.decl?.start?.line || 0) === lineNumber)
    .map(([functionId]) => Number(fileCoverage.f?.[functionId] || 0));
}

function getCoveredFunctionCountsStartingOnLine(fileCoverage, lineNumber) {
  return getFunctionCountsStartingOnLine(fileCoverage, lineNumber)
    .filter((count) => count > 0);
}

function getCoveredFunctionRangesContainingLine(fileCoverage, lineNumber) {
  return Object.entries(fileCoverage.fnMap || {})
    .filter(([functionId, functionCoverage]) => Number(fileCoverage.f?.[functionId] || 0) > 0
      && Number(functionCoverage?.loc?.start?.line || 0) <= lineNumber
      && lineNumber <= Number(functionCoverage?.loc?.end?.line || 0))
    .map(([functionId, functionCoverage]) => ({
      functionId,
      functionCoverage,
      count: Number(fileCoverage.f?.[functionId] || 0),
    }));
}

function getCoveredFunctionCountsContainingLine(fileCoverage, lineNumber) {
  return getCoveredFunctionRangesContainingLine(fileCoverage, lineNumber)
    .map(({ count }) => count);
}

function getSingleLineEmptyBlockFunctionStatus(fileCoverage, sourceLines, lineNumber) {
  if (!isSingleLineEmptyBlockFunctionLine(getLineText(sourceLines, lineNumber))) {
    return null;
  }

  const functionCounts = Object.entries(fileCoverage.fnMap || {})
    .filter(([, functionCoverage]) => Number(functionCoverage?.line || 0) === lineNumber
      || Number(functionCoverage?.loc?.start?.line || 0) === lineNumber)
    .map(([functionId]) => Number(fileCoverage.f?.[functionId] || 0));
  if (!functionCounts.length) {
    return null;
  }

  return functionCounts.some((count) => count > 0)
    ? 'yes'
    : 'no';
}

function promoteCoveredMultilineExpressionBodiedFunctionHeaderLines(lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!/\bfun\b[\s\S]*\.[A-Za-z_]\w*\s*\(/u.test(lineText) || !/\)\s*(?::[^=]+)?\s*=\s*$/u.test(lineText)) {
      continue;
    }

    if (Number(lineCoverage[lineNumber]) > 0) {
      continue;
    }

    const nextLine = nextExecutableLineAfter(filePath, sourceLines, lineNumber + 1, 4);
    if (!nextLine || !(Number(lineCoverage[nextLine]) > 0)) {
      continue;
    }

    setLineCoverage(lineCoverage, lineNumber, Number(lineCoverage[nextLine]));
  }
}

function promoteMultilineExpressionBodyContinuationLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    if (Number(lineCoverage[lineNumber]) > 0 || branchStats.has(lineNumber) || isForceNeutralLine(filePath, sourceLines, lineNumber)) {
      continue;
    }

    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!lineText || !isLikelyExecutableLine(lineText)) {
      continue;
    }
    if (isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)
      || isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)
      || isLineInUncoveredCatchBlock(fileCoverage, filePath, sourceLines, lineNumber)
      || shouldHardSuppressZeroCountLambdaLine(fileCoverage, sourceLines, lineNumber)) {
      continue;
    }

    let headerLine = null;
    for (let cursor = lineNumber - 1, minLine = Math.max(1, lineNumber - 3); cursor >= minLine; cursor -= 1) {
      const candidateText = getLineText(sourceLines, cursor).trim();
      if (!candidateText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(candidateText)) {
        continue;
      }
      if (/\bfun\b/u.test(candidateText) && /\)\s*(?::[^=]+)?\s*=\s*$/u.test(candidateText)) {
        headerLine = cursor;
      }
      break;
    }
    if (!headerLine) {
      continue;
    }

    const coveredFunctionCounts = getCoveredFunctionCountsContainingLine(fileCoverage, lineNumber);
    if (!coveredFunctionCounts.length) {
      continue;
    }

    setLineCoverage(lineCoverage, lineNumber, Math.max(...coveredFunctionCounts));
  }
}

function promoteCoveredSimpleFunctionGapLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    const count = Number(fileCoverage.f?.[functionId] || 0);
    const locStartLine = functionCoverage?.loc?.start?.line;
    const locEndLine = functionCoverage?.loc?.end?.line;
    if (count <= 0 || !locStartLine || !locEndLine || locEndLine <= locStartLine) {
      continue;
    }

    const headerStartLine = findFunctionHeaderStartLine(sourceLines, locStartLine);
    if (!headerStartLine || !/\bfun\b/u.test(getLineText(sourceLines, headerStartLine))) {
      continue;
    }
    if (!headerStartLine) {
      continue;
    }

    const signatureEndLine = findFunctionSignatureEndLine(sourceLines, headerStartLine, locStartLine);
    const bodyLines = getExecutableLinesInRange(filePath, sourceLines, signatureEndLine + 1, locEndLine)
      .filter((lineNumber) => !branchStats.has(lineNumber));
    if (bodyLines.length < 3 || bodyLines.length > 16) {
      continue;
    }

    if (bodyLines.some((lineNumber) => {
      const lineText = getLineText(sourceLines, lineNumber);
      return isSimpleControlFlowLine(lineText) || lineText.includes('{') || lineText.includes('}');
    })) {
      continue;
    }

    const coveredCounts = bodyLines
      .map((lineNumber) => lineCoverage[lineNumber])
      .filter((lineValue) => Number(lineValue) > 0);
    if (coveredCounts.length < 2) {
      continue;
    }

    const fallbackCount = Math.max(count, ...coveredCounts);
    for (let index = 1; index < bodyLines.length - 1; index += 1) {
      const lineNumber = bodyLines[index];
      if (Number(lineCoverage[lineNumber]) > 0) {
        continue;
      }

      if (!(Number(lineCoverage[bodyLines[index - 1]]) > 0) || !(Number(lineCoverage[bodyLines[index + 1]]) > 0)) {
        continue;
      }

      if (!isSimpleExpressionLikeLine(getLineText(sourceLines, lineNumber))) {
        continue;
      }

      const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
      if (directStatementCount != null && directStatementCount > 0) {
        continue;
      }

      lineCoverage[lineNumber] = fallbackCount;
    }
  }
}

function canPromoteFunctionEntryGapLine(fileCoverage, filePath, sourceLines, lineNumber, branchStats, functionId, functionStartLine, functionEndLine) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!lineText || !isLikelyExecutableLine(lineText)) {
    return false;
  }
  if (branchStats.has(lineNumber) || /^(?:return(?:@\w+)?|throw)\b/u.test(lineText)) {
    return false;
  }
  if (isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)
    || isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)
    || isLineInUncoveredCatchBlock(fileCoverage, filePath, sourceLines, lineNumber)) {
    return false;
  }
  const zeroCountLambda = shouldHardSuppressZeroCountLambdaLine(fileCoverage, sourceLines, lineNumber);
  if (zeroCountLambda) {
    return false;
  }
  const zeroCountNamedFn = findInnermostZeroCountNamedFunctionRange(fileCoverage, sourceLines, lineNumber);
  if (zeroCountNamedFn
    && zeroCountNamedFn.functionId !== functionId
    && zeroCountNamedFn.startLine >= functionStartLine
    && zeroCountNamedFn.endLine <= functionEndLine
    && !hasCoveredNestedFunctionContainedInRange(fileCoverage, zeroCountNamedFn.startLine, zeroCountNamedFn.endLine, zeroCountNamedFn.functionId)) {
    return false;
  }
  return true;
}

function promoteFunctionEntryGapLines(fileCoverage, lineCoverage, filePath, sourceLines, branchStats) {
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    const count = Number(fileCoverage.f?.[functionId] || 0);
    const locStartLine = functionCoverage?.loc?.start?.line;
    const locEndLine = functionCoverage?.loc?.end?.line;
    if (count <= 0 || !locStartLine || !locEndLine || locEndLine <= locStartLine) {
      continue;
    }

    const headerStartLine = findFunctionHeaderStartLine(sourceLines, locStartLine);
    if (!headerStartLine || !/\bfun\b/u.test(getLineText(sourceLines, headerStartLine))) {
      continue;
    }

    const signatureEndLine = findFunctionSignatureEndLine(sourceLines, headerStartLine, locStartLine);
    const bodyLines = getExecutableLinesInRange(filePath, sourceLines, signatureEndLine + 1, locEndLine);
    const firstCoveredIndex = bodyLines.findIndex((lineNumber) => Number(lineCoverage[lineNumber]) > 0 || Number(getDirectStatementCountOnLine(fileCoverage, lineNumber)) > 0);
    if (firstCoveredIndex <= 0 || firstCoveredIndex > 8) {
      continue;
    }

    const firstCoveredLine = bodyLines[firstCoveredIndex];
    const firstCoveredCount = Math.max(
      count,
      Number(lineCoverage[firstCoveredLine] || 0),
      Number(getDirectStatementCountOnLine(fileCoverage, firstCoveredLine) || 0),
    );
    for (let index = 0; index < firstCoveredIndex; index += 1) {
      const lineNumber = bodyLines[index];
      if (Number(lineCoverage[lineNumber]) > 0) {
        continue;
      }
      if (!canPromoteFunctionEntryGapLine(fileCoverage, filePath, sourceLines, lineNumber, branchStats, functionId, signatureEndLine + 1, locEndLine)) {
        continue;
      }
      setLineCoverage(lineCoverage, lineNumber, firstCoveredCount);
    }
  }
}

function promoteCoveredBuilderWrapperLines(lineCoverage, filePath, sourceLines) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    if (Number(lineCoverage[lineNumber]) > 0 || isForceNeutralLine(filePath, sourceLines, lineNumber)) {
      continue;
    }

    const lineText = getLineText(sourceLines, lineNumber).trim();
    if (!/\.(?:apply|also|let|run)\s*\{\s*$/u.test(lineText)) {
      continue;
    }

    const endLine = findBlockEndLine(sourceLines, lineNumber);
    if (endLine <= lineNumber + 1) {
      continue;
    }

    const coveredBodyCounts = getExecutableLinesInRange(filePath, sourceLines, lineNumber + 1, endLine - 1)
      .map((candidate) => lineCoverage[candidate])
      .filter((candidate) => Number(candidate) > 0);
    if (!coveredBodyCounts.length) {
      continue;
    }

    lineCoverage[lineNumber] = Math.max(...coveredBodyCounts);
  }
}

function applySimpleFunctionBodyFallback(lineCoverage, filePath, sourceLines, branchStats) {
  for (let lineNumber = 1; lineNumber <= sourceLines.length; lineNumber += 1) {
    const headerText = getLineText(sourceLines, lineNumber);
    if (!/\bfun\b/u.test(headerText) || !headerText.includes('{')) {
      continue;
    }

    let depth = 0;
    let endLine = lineNumber;
    let started = false;
    for (let cursor = lineNumber; cursor <= sourceLines.length; cursor += 1) {
      const text = getLineText(sourceLines, cursor);
      for (const ch of text) {
        if (ch === '{') {
          depth += 1;
          started = true;
        } else if (ch === '}') {
          depth -= 1;
        }
      }
      if (started && depth === 0) {
        endLine = cursor;
        break;
      }
    }

    const bodyLines = [];
    let hasComplexControlFlow = false;
    let hasNestedBlock = false;
    for (let cursor = lineNumber + 1; cursor < endLine; cursor += 1) {
      const text = getLineText(sourceLines, cursor);
      if (isForceNeutralLine(filePath, sourceLines, cursor)) {
        continue;
      }
      bodyLines.push(cursor);
      if (isSimpleControlFlowLine(text)) {
        hasComplexControlFlow = true;
      }
      if (text.includes('{') || text.includes('}')) {
        hasNestedBlock = true;
      }
    }

    const objectWrapperLine = getPromotableObjectWrapperLine(lineCoverage, filePath, sourceLines, lineNumber, endLine, branchStats);

    if (!bodyLines.length || bodyLines.length > 3 || hasComplexControlFlow || hasNestedBlock) {
      if (objectWrapperLine != null) {
        lineCoverage[lineNumber] = lineCoverage[objectWrapperLine];
      }
      continue;
    }

    if (bodyLines.some((cursor) => branchStats.has(cursor))) {
      continue;
    }

    const coveredCounts = bodyLines
      .map((cursor) => lineCoverage[cursor])
      .filter((count) => Number(count) > 0);
    if (!coveredCounts.length) {
      continue;
    }

    const fallbackCount = Math.max(...coveredCounts);
    bodyLines.forEach((cursor) => {
      if (!(Number(lineCoverage[cursor]) > 0)) {
        lineCoverage[cursor] = fallbackCount;
      }
    });

    if (shouldPromoteSimpleFunctionSignatureLine(lineCoverage, lineNumber, bodyLines)) {
      lineCoverage[lineNumber] = fallbackCount;
    }
  }
}

function buildBranchLineStats(fileCoverage) {
  const branchStats = new Map();

  for (const [branchId, branchCoverage] of Object.entries(fileCoverage.branchMap || {})) {
    const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];
    const branchLine = branchCoverage?.line;
    if (branchLine) {
      const hasCoveredPath = branchCounts.some((count) => Number(count || 0) > 0);
      const hasUncoveredPath = branchCounts.some((count) => Number(count || 0) === 0);
      if (hasCoveredPath) {
        markBranchLineStatus(branchStats, branchLine, true);
      }
      if (hasUncoveredPath) {
        markBranchLineStatus(branchStats, branchLine, false);
      }
    }

    const locations = Array.isArray(branchCoverage?.locations) ? branchCoverage.locations : [];
    locations.forEach((location, index) => {
      const lineNumber = location?.start?.line;
      markBranchLineStatus(branchStats, lineNumber, Number(branchCounts[index] || 0) > 0);
    });
  }

  return branchStats;
}

function hasCoveredExecutableLineInRange(fileCoverage, filePath, sourceLines, startLine, endLine) {
  for (let cursor = startLine; cursor <= endLine; cursor += 1) {
    if (isForceNeutralLine(filePath, sourceLines, cursor)) {
      continue;
    }
    if (Number(getLineCoverageCount(fileCoverage, cursor)) > 0) {
      return true;
    }
  }
  return false;
}

function hasCoveredExecutableBeforeBlockExit(fileCoverage, filePath, sourceLines, startLine, maxLookahead = 6) {
  const endLine = Math.min(sourceLines.length, startLine + maxLookahead - 1);
  for (let cursor = startLine; cursor <= endLine; cursor += 1) {
    const lineText = getLineText(sourceLines, cursor).trim();
    if (!lineText) {
      continue;
    }
    if (/^\}/u.test(lineText)) {
      return false;
    }
    if (isForceNeutralLine(filePath, sourceLines, cursor)) {
      continue;
    }
    if (Number(getLineCoverageCount(fileCoverage, cursor)) > 0) {
      return true;
    }
  }
  return false;
}

function nextExecutableLineAfter(filePath, sourceLines, startLine, maxLookahead = 6) {
  const endLine = Math.min(sourceLines.length, startLine + maxLookahead - 1);
  for (let cursor = startLine; cursor <= endLine; cursor += 1) {
    const lineText = getLineText(sourceLines, cursor).trim();
    if (!lineText) {
      continue;
    }
    if (/^\}/u.test(lineText)) {
      return null;
    }
    if (!isForceNeutralLine(filePath, sourceLines, cursor)) {
      return cursor;
    }
  }
  return null;
}

function hasCoveredSpanningStatementStartingOnLine(fileCoverage, lineNumber) {
  return getCoveredSpanningStatementCountsStartingOnLine(fileCoverage, lineNumber).length > 0;
}

function hasCoveredSpanningStatementStartingOnLineWithinRange(fileCoverage, lineNumber, endLine) {
  return Object.entries(fileCoverage.statementMap || {}).some(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
    && loc?.start?.line === lineNumber
    && Number(loc?.end?.line || 0) <= endLine);
}

function getPromotedWhenArmHeaderStatus(fileCoverage, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!/->\s*\{\s*$/u.test(lineText)) {
    return null;
  }
  if (isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)
    || isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)) {
    return null;
  }

  const armEndLine = findBlockEndLine(sourceLines, lineNumber);
  if (armEndLine <= lineNumber + 1) {
    return null;
  }

  const hasCoveredArmExecution = hasCoveredSpanningStatementStartingOnLine(fileCoverage, lineNumber)
    || hasCoveredStatementContainedInRange(fileCoverage, lineNumber + 1, armEndLine - 1)
    || hasCoveredBranchContainedInRange(fileCoverage, lineNumber + 1, armEndLine - 1);
  if (!hasCoveredArmExecution) {
    return null;
  }

  for (let cursor = lineNumber - 1, minLine = Math.max(1, lineNumber - 120); cursor >= minLine; cursor -= 1) {
    const candidateText = getLineText(sourceLines, cursor).trim();
    if (!candidateText || isPureClosingLine(candidateText) || /^(?:\/\/|\/\*|\*|\*\/)/u.test(candidateText)) {
      continue;
    }
    if (/\bwhen\b[\s\S]*\{\s*$/u.test(candidateText)) {
      return 'yes';
    }
    if (/\bfun\b/u.test(candidateText) || classSignatureLinePattern.test(candidateText)) {
      break;
    }
  }

  return null;
}

function getPromotedCoveredControlHeaderStatus(fileCoverage, sourceLines, lineNumber) {
  if (!hasCoveredSpanningStatementStartingOnLine(fileCoverage, lineNumber)) {
    return null;
  }

  const normalizedLineText = getLineText(sourceLines, lineNumber).trim().replace(/^(?:\}\s*)+/u, '');
  if (/->\s*if\b/u.test(normalizedLineText)) {
    return null;
  }

  if (/^(?:if|else\s+if)\b/u.test(normalizedLineText)
    || /^(?:val|var)\b[\s\S]*=\s*if\b/u.test(normalizedLineText)
    || /^return\s+if\b/u.test(normalizedLineText)) {
    return 'yes';
  }

  return null;
}

function getPromotedMultilineControlConditionContinuationStatus(fileCoverage, sourceLines, lineNumber) {
  if (!isMultilineControlConditionContinuationLine(sourceLines, lineNumber)) {
    return null;
  }

  const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
  if (directStatementCount != null && directStatementCount > 0) {
    return null;
  }

  const coveredCounts = Object.entries(fileCoverage.statementMap || {})
    .filter(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
      && Number(loc?.start?.line || 0) < lineNumber
      && lineNumber <= Number(loc?.end?.line || 0)
      && Number(loc?.end?.line || 0) - Number(loc?.start?.line || 0) <= 3)
    .map(([statementId]) => Number(fileCoverage.s?.[statementId] || 0));

  return coveredCounts.length ? 'yes' : null;
}

function getPromotedExpressionBodiedFunctionStatus(fileCoverage, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!/\bfun\b/u.test(lineText) || !/\)\s*(?::[^=]+)?\s*=/u.test(lineText)) {
    return null;
  }

  // Only promote if the expression-bodied function was actually called.
  // Prefer the current line, but allow the mapped fnMap start to land on the
  // next expression line for multiline expression-bodied functions.
  const coveredFunctionCounts = getCoveredFunctionCountsStartingOnLine(fileCoverage, lineNumber);
  if (coveredFunctionCounts.length > 0) {
    return 'yes';
  }

  if (!/\)\s*(?::[^=]+)?\s*=\s*$/u.test(lineText)) {
    return null;
  }

  for (let cursor = lineNumber + 1, maxLine = Math.min(sourceLines.length, lineNumber + 3); cursor <= maxLine; cursor += 1) {
    const candidateText = getLineText(sourceLines, cursor).trim();
    if (!candidateText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(candidateText)) {
      continue;
    }
    return getCoveredFunctionCountsStartingOnLine(fileCoverage, cursor).length > 0
      ? 'yes'
      : null;
  }

  return null;
}

function getPromotedMultilineExpressionBodyContinuationStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!lineText || !isLikelyExecutableLine(lineText)) {
    return null;
  }
  if (isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)
    || isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)
    || isLineInUncoveredCatchBlock(fileCoverage, filePath, sourceLines, lineNumber)
    || shouldHardSuppressZeroCountLambdaLine(fileCoverage, sourceLines, lineNumber)) {
    return null;
  }

  let headerLine = null;
  for (let cursor = lineNumber - 1, minLine = Math.max(1, lineNumber - 3); cursor >= minLine; cursor -= 1) {
    const candidateText = getLineText(sourceLines, cursor).trim();
    if (!candidateText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(candidateText)) {
      continue;
    }
    if (/\bfun\b/u.test(candidateText) && /\)\s*(?::[^=]+)?\s*=\s*$/u.test(candidateText)) {
      headerLine = cursor;
    }
    break;
  }
  if (!headerLine) {
    return null;
  }

  return getCoveredFunctionCountsContainingLine(fileCoverage, lineNumber).length > 0
    ? 'yes'
    : null;
}

function getPromotedFunctionEntryGapStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const enclosingFunction = findEnclosingBlockFunctionRange(sourceLines, lineNumber);
  if (!enclosingFunction) {
    return null;
  }

  const topLevelLines = getTopLevelExecutableLinesInFunctionRange(filePath, sourceLines, enclosingFunction.startLine, enclosingFunction.endLine);
  const entryIndex = topLevelLines.indexOf(lineNumber);
  if (entryIndex === -1 || entryIndex > 4) {
    return null;
  }

  if (isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)
    || isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)
    || isLineInUncoveredCatchBlock(fileCoverage, filePath, sourceLines, lineNumber)
    || shouldHardSuppressZeroCountLambdaLine(fileCoverage, sourceLines, lineNumber)) {
    return null;
  }

  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!lineText || /^(?:return(?:@\w+)?|throw)\b/u.test(lineText) || !isLikelyExecutableLine(lineText)) {
    return null;
  }

  const nextCoveredLine = topLevelLines.slice(entryIndex + 1, entryIndex + 6)
    .find((candidate) => Number(getLineCoverageCount(fileCoverage, candidate)) > 0 || Number(getDirectStatementCountOnLine(fileCoverage, candidate) || 0) > 0);
  if (!nextCoveredLine) {
    return null;
  }

  return getCoveredFunctionCountsContainingLine(fileCoverage, lineNumber).length > 0
    ? 'yes'
    : null;
}

function getPromotedExpressionBodiedAccessorStatus(fileCoverage, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (/^(?:get|set)\s*\([^)]*\)\s*=\s*/u.test(lineText)) {
    return getCoveredFunctionCountsStartingOnLine(fileCoverage, lineNumber).length > 0
      ? 'yes'
      : null;
  }

  if (!/^(?:override\s+)?(?:val|var)\b/u.test(lineText)) {
    return null;
  }

  for (let cursor = lineNumber + 1, maxLine = Math.min(sourceLines.length, lineNumber + 3); cursor <= maxLine; cursor += 1) {
    const candidateText = getLineText(sourceLines, cursor).trim();
    if (!candidateText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(candidateText)) {
      continue;
    }
    if (/^(?:get|set)\s*\([^)]*\)\s*=\s*/u.test(candidateText)
      && getCoveredFunctionCountsStartingOnLine(fileCoverage, cursor).length > 0) {
      return 'yes';
    }
    break;
  }

  return null;
}

function getPromotedDataClassHeaderStatus(fileCoverage, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!/^data\s+class\b/u.test(lineText)) {
    return null;
  }

  return getCoveredFunctionCountsStartingOnLine(fileCoverage, lineNumber).length > 0
    ? 'yes'
    : null;
}

function getPromotedCoveredFunctionStatementStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const enclosingFunction = findEnclosingBlockFunctionRange(sourceLines, lineNumber);
  if (!enclosingFunction) {
    return null;
  }

  const zeroCountLambda = findInnermostZeroCountLambdaRange(fileCoverage, sourceLines, lineNumber);
  if (zeroCountLambda
    && lineNumber !== zeroCountLambda.startLine
    && !hasLocalCoveredExecutionInRange(fileCoverage, zeroCountLambda.startLine, zeroCountLambda.endLine, zeroCountLambda.functionId)) {
    return null;
  }

  // Check if the line is inside an uncovered named function — spanning statements
  // from the outer covered function should not promote lines within an inner
  // uncovered named function.
  const zeroCountNamedFn = findInnermostZeroCountNamedFunctionRange(fileCoverage, sourceLines, lineNumber);
  if (zeroCountNamedFn
    && lineNumber !== zeroCountNamedFn.startLine
    && !hasCoveredNestedFunctionContainedInRange(fileCoverage, zeroCountNamedFn.startLine, zeroCountNamedFn.endLine, zeroCountNamedFn.functionId)) {
    return null;
  }

  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (/^(?:return(?:@\w+)?|throw)\b/u.test(lineText) || isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)) {
    return null;
  }

  const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
  if (directStatementCount != null && directStatementCount > 0) {
    return null;
  }

  const coveredCounts = Object.entries(fileCoverage.statementMap || {})
    .filter(([statementId, loc]) => Number(fileCoverage.s?.[statementId] || 0) > 0
      && Number(loc?.start?.line || 0) >= enclosingFunction.startLine
      && Number(loc?.end?.line || 0) <= enclosingFunction.endLine
      && Number(loc?.end?.line || 0) > Number(loc?.start?.line || 0)
      && Number(loc?.end?.line || 0) - Number(loc?.start?.line || 0) <= 14
      && Number(loc?.start?.line || 0) <= lineNumber
      && lineNumber <= Number(loc?.end?.line || 0))
    .map(([statementId]) => Number(fileCoverage.s?.[statementId] || 0));

  return coveredCounts.length ? 'yes' : null;
}

function findEnclosingBlockFunctionRange(sourceLines, lineNumber) {
  for (let cursor = lineNumber; cursor >= 1; cursor -= 1) {
    const openLineText = getLineText(sourceLines, cursor);
    if (!openLineText.includes('{')) {
      continue;
    }

    const headerStartLine = findFunctionHeaderStartLine(sourceLines, cursor);
    if (!headerStartLine || headerStartLine > cursor) {
      continue;
    }
    if (!/\bfun\b/u.test(getLineText(sourceLines, headerStartLine))) {
      continue;
    }

    const signatureEndLine = findFunctionSignatureEndLine(sourceLines, headerStartLine, cursor);
    if (signatureEndLine !== cursor) {
      continue;
    }

    const endLine = findBlockEndLine(sourceLines, cursor);
    if (endLine >= lineNumber) {
      return {
        startLine: headerStartLine,
        endLine,
      };
    }
  }

  return null;
}

// Promote simple executable statements inside a called function when sourcemap
// gaps cause missing line coverage. Guards prevent false promotion in uncovered
// branches, catch blocks, nested uncovered functions, and overly large functions.
function getPromotedSimpleStatementInCalledFunctionStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const enclosingFunction = findEnclosingBlockFunctionRange(sourceLines, lineNumber);
  if (!enclosingFunction) {
    return null;
  }

  // Skip if the function body is too large — larger functions are more likely
  // to have genuinely uncovered lines and promoting them would be unreliable.
  if (enclosingFunction.endLine - enclosingFunction.startLine > 80) {
    return null;
  }

  // Check if the enclosing function was actually called
  const functionCounts = getCoveredFunctionCountsStartingOnLine(fileCoverage, enclosingFunction.startLine);
  if (!functionCounts.length) {
    return null;
  }

  const lineText = getLineText(sourceLines, lineNumber).trim();

  if (isInlineWhenArmLine(lineText)) {
    return null;
  }

  // Skip return/throw lines — they may not execute if an earlier branch exits
  if (/^(?:return(?:@\w+)?|throw)\b/u.test(lineText)) {
    return null;
  }

  // Skip lines in reliably uncovered branch arms
  if (isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)) {
    return null;
  }

  // Skip lines inside uncovered catch blocks
  if (isLineInUncoveredCatchBlock(fileCoverage, filePath, sourceLines, lineNumber)) {
    return null;
  }

  // Skip if the line is inside a nested zero-count lambda
  const zeroCountLambda = findInnermostZeroCountLambdaRange(fileCoverage, sourceLines, lineNumber);
  if (zeroCountLambda
    && lineNumber !== zeroCountLambda.startLine
    && !hasLocalCoveredExecutionInRange(fileCoverage, zeroCountLambda.startLine, zeroCountLambda.endLine, zeroCountLambda.functionId)) {
    return null;
  }

  // Skip if the line is inside a nested zero-count named function
  const zeroCountNamedFn = findInnermostZeroCountNamedFunctionRange(fileCoverage, sourceLines, lineNumber);
  if (zeroCountNamedFn
    && zeroCountNamedFn.startLine !== enclosingFunction.startLine
    && !hasCoveredNestedFunctionContainedInRange(fileCoverage, zeroCountNamedFn.startLine, zeroCountNamedFn.endLine, zeroCountNamedFn.functionId)) {
    return null;
  }

  return 'yes';
}

function findInnermostZeroCountLambdaRange(fileCoverage, sourceLines, lineNumber) {
  let match = null;
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    if (Number(fileCoverage.f?.[functionId] || 0) > 0) {
      continue;
    }

    const startLine = Number(functionCoverage?.loc?.start?.line || 0);
    const endLine = Number(functionCoverage?.loc?.end?.line || 0);
    if (!startLine || !endLine || lineNumber < startLine || lineNumber > endLine) {
      continue;
    }

    const headerText = getLineText(sourceLines, startLine).trim();
    if (/\bfun\b/u.test(headerText)) {
      continue;
    }

    if (!match || (endLine - startLine) < (match.endLine - match.startLine)) {
      match = { functionId, startLine, endLine };
    }
  }

  return match;
}

function findInnermostHardSuppressedZeroCountLambdaRange(fileCoverage, sourceLines, lineNumber) {
  let match = null;
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    if (Number(fileCoverage.f?.[functionId] || 0) > 0) {
      continue;
    }

    const startLine = Number(functionCoverage?.loc?.start?.line || 0);
    const endLine = Number(functionCoverage?.loc?.end?.line || 0);
    if (!startLine || !endLine || endLine < startLine || lineNumber < startLine || lineNumber > endLine) {
      continue;
    }

    const headerText = getLineText(sourceLines, startLine).trim();
    if (/\bfun\b/u.test(headerText)) {
      continue;
    }

    if (hasCoveredNestedFunctionContainedInRange(fileCoverage, startLine, endLine, functionId)) {
      continue;
    }

    const bodyStartLine = startLine + 1;
    const bodyEndLine = endLine - 1;
    if (bodyStartLine <= bodyEndLine && hasDirectCoveredStatementContainedInRange(fileCoverage, bodyStartLine, bodyEndLine)) {
      continue;
    }

    if (!match || (endLine - startLine) < (match.endLine - match.startLine)) {
      match = { functionId, startLine, endLine };
    }
  }

  return match;
}

function shouldHardSuppressZeroCountLambdaLine(fileCoverage, sourceLines, lineNumber) {
  const hardSuppressedRange = findInnermostHardSuppressedZeroCountLambdaRange(fileCoverage, sourceLines, lineNumber);
  if (!hardSuppressedRange) {
    return false;
  }

  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (lineNumber === hardSuppressedRange.startLine || !isLikelyExecutableLine(lineText)) {
    return false;
  }

  const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
  return directStatementCount == null || directStatementCount === 0;
}

// Similar to findInnermostZeroCountLambdaRange but for named `fun` functions.
// Returns the innermost zero-count named function range containing the given line,
// or null if none found. Used to prevent spanning statement leakage from an outer
// covered function into an inner uncovered named function.
function findInnermostZeroCountNamedFunctionRange(fileCoverage, sourceLines, lineNumber) {
  let match = null;
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    if (Number(fileCoverage.f?.[functionId] || 0) > 0) {
      continue;
    }

    const startLine = Number(functionCoverage?.loc?.start?.line || 0);
    const endLine = Number(functionCoverage?.loc?.end?.line || 0);
    if (!startLine || !endLine || endLine < startLine || lineNumber < startLine || lineNumber > endLine) {
      continue;
    }

    const headerText = getLineText(sourceLines, startLine).trim();
    // Only match named functions (lines containing `fun` keyword)
    if (!/\bfun\b/u.test(headerText)) {
      continue;
    }

    if (!match || (endLine - startLine) < (match.endLine - match.startLine)) {
      match = { functionId, startLine, endLine };
    }
  }

  return match;
}

function hasLocalCoveredExecutionInRange(fileCoverage, startLine, endLine, excludedFunctionId) {
  return hasCoveredStatementContainedInRange(fileCoverage, startLine, endLine)
    || hasCoveredBranchContainedInRange(fileCoverage, startLine, endLine)
    || hasCoveredNestedFunctionContainedInRange(fileCoverage, startLine, endLine, excludedFunctionId)
    || hasCoveredSpanningStatementStartingOnLineWithinRange(fileCoverage, startLine, endLine);
}

function shouldSuppressCoveredLineInFunctionWithoutLocalExecution(fileCoverage, filePath, sourceLines, lineNumber) {
  if (!(Number(getLineCoverageCount(fileCoverage, lineNumber)) > 0)) {
    return false;
  }

  const directStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
  if (directStatementCount != null && directStatementCount > 0) {
    return false;
  }

  const lineText = getLineText(sourceLines, lineNumber);
  if (isRuntimeInitializedPropertyDeclaration(lineText)) {
    return false;
  }

  const enclosingFunction = findEnclosingBlockFunctionRange(sourceLines, lineNumber);
  if (!enclosingFunction) {
    return false;
  }

  if (hasCoveredStatementContainedInRange(fileCoverage, enclosingFunction.startLine, enclosingFunction.endLine)
    || hasCoveredNestedFunctionContainedInRange(fileCoverage, enclosingFunction.startLine, enclosingFunction.endLine, null)
    || hasCoveredSpanningStatementStartingOnLine(fileCoverage, enclosingFunction.startLine)
    || hasCoveredExecutionOwnedByFunctionOnLine(fileCoverage, enclosingFunction.startLine, enclosingFunction.endLine, lineNumber, null)) {
    return false;
  }

  return true;
}

function hasCoveredExecutionAfterControlBlock(fileCoverage, filePath, sourceLines, startLine) {
  let nextLine = nextExecutableLineAfter(filePath, sourceLines, startLine);
  const visited = new Set();

  while (nextLine && !visited.has(nextLine)) {
    visited.add(nextLine);

    if (Number(getLineCoverageCount(fileCoverage, nextLine)) > 0) {
      return true;
    }

    const nextText = getLineText(sourceLines, nextLine).trim().replace(/^(?:\}\s*)+/u, '');
    if (!/^(?:if|else\s+if)\b/u.test(nextText) || !nextText.includes('{')) {
      return false;
    }

    const nextEndLine = findBlockEndLine(sourceLines, nextLine);
    if (nextEndLine > nextLine + 1
      && hasCoveredExecutableLineInRange(fileCoverage, filePath, sourceLines, nextLine + 1, nextEndLine - 1)) {
      return true;
    }

    nextLine = nextExecutableLineAfter(filePath, sourceLines, nextEndLine + 1);
  }

  return false;
}

function findMultilineControlHeaderEndLine(sourceLines, lineNumber, maxLookahead = 6) {
  for (let cursor = lineNumber + 1, maxLine = Math.min(sourceLines.length, lineNumber + maxLookahead); cursor <= maxLine; cursor += 1) {
    const lineText = getLineText(sourceLines, cursor).trim();
    if (!lineText || /^(?:\/\/|\/\*|\*|\*\/)/u.test(lineText)) {
      continue;
    }
    if (/\)\s*\{\s*$/u.test(lineText)) {
      return cursor;
    }
    if (/\{\s*$/u.test(lineText) || /;\s*$/u.test(lineText)) {
      return null;
    }
  }

  return null;
}

function getPromotedMultilineControlHeaderStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim().replace(/^(?:\}\s*)+/u, '');
  if (!/^(?:if|else\s+if)\b/u.test(lineText) || lineText.includes('{')) {
    return null;
  }

  const conditionEndLine = findMultilineControlHeaderEndLine(sourceLines, lineNumber);
  if (!conditionEndLine) {
    return null;
  }

  const blockEndLine = findBlockEndLine(sourceLines, conditionEndLine);
  if (blockEndLine > conditionEndLine + 1
    && hasCoveredExecutableLineInRange(fileCoverage, filePath, sourceLines, conditionEndLine + 1, blockEndLine - 1)) {
    return 'yes';
  }

  return hasCoveredExecutionAfterControlBlock(fileCoverage, filePath, sourceLines, blockEndLine + 1)
    ? 'partial'
    : null;
}

function getPromotedControlLineStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  const normalizedLineText = lineText.replace(/^(?:\}\s*)+/u, '');
  if (!/^(?:if|else\s+if)\b/u.test(normalizedLineText)) {
    return null;
  }

  if (normalizedLineText.includes('{')) {
    const endLine = findBlockEndLine(sourceLines, lineNumber);
    if (endLine > lineNumber + 1 && hasCoveredExecutableLineInRange(fileCoverage, filePath, sourceLines, lineNumber + 1, endLine - 1)) {
      return 'yes';
    }

    return hasCoveredExecutionAfterControlBlock(fileCoverage, filePath, sourceLines, endLine + 1)
      ? 'partial'
      : null;
  }

  if (/\breturn(?:@\w+)?\b/u.test(lineText) && hasCoveredExecutableBeforeBlockExit(fileCoverage, filePath, sourceLines, lineNumber + 1)) {
    return 'partial';
  }

  return null;
}

function getPromotedInitializedPropertyHeaderStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!isMultilineInitializedPropertyHeaderLine(lineText)) {
    return null;
  }

  if (isMultilineLambdaInitializedPropertyHeaderLine(sourceLines, lineNumber)) {
    const lambdaStartLine = findNextMeaningfulLineNumber(sourceLines, lineNumber, 3);
    if (!lambdaStartLine) {
      return null;
    }

    const lambdaEndLine = findBlockEndLine(sourceLines, lambdaStartLine);
    return lambdaEndLine > lambdaStartLine
      && hasCoveredExecutableLineInRange(fileCoverage, filePath, sourceLines, lambdaStartLine + 1, lambdaEndLine - 1)
      ? 'yes'
      : null;
  }

  return hasCoveredSpanningStatementStartingOnLine(fileCoverage, lineNumber)
    ? 'yes'
    : null;
}

function getPromotedBlockFunctionHeaderStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!isBlockFunctionHeaderLine(lineText)) {
    return null;
  }

  const endLine = findBlockEndLine(sourceLines, lineNumber);
  if (endLine <= lineNumber + 1) {
    return null;
  }

  // Only promote to 'yes' if the function itself was actually called (has a non-zero
  // execution count in fnMap). If no matching fnMap entry has count > 0, the header
  // line was never executed — fall back to neutral rather than falsely showing green.
  const coveredFunctionCounts = getCoveredFunctionCountsStartingOnLine(fileCoverage, lineNumber);
  if (!coveredFunctionCounts.length) {
    return null;
  }

  return hasCoveredExecutableLineInRange(fileCoverage, filePath, sourceLines, lineNumber + 1, endLine - 1)
    ? 'yes'
    : null;
}

function deriveLineStatus(fileCoverage, filePath, sourceLines, lineNumber, branchStats) {
  const promotedFunctionEntryGapStatus = getPromotedFunctionEntryGapStatus(fileCoverage, filePath, sourceLines, lineNumber);
  if (promotedFunctionEntryGapStatus) {
    return promotedFunctionEntryGapStatus;
  }

  const promotedMultilineExpressionBodyContinuationStatus = getPromotedMultilineExpressionBodyContinuationStatus(fileCoverage, filePath, sourceLines, lineNumber);
  if (promotedMultilineExpressionBodyContinuationStatus) {
    return promotedMultilineExpressionBodyContinuationStatus;
  }

  const preNeutralExpressionBodiedFunctionStatus = getPromotedExpressionBodiedFunctionStatus(fileCoverage, sourceLines, lineNumber);
  if (preNeutralExpressionBodiedFunctionStatus) {
    return preNeutralExpressionBodiedFunctionStatus;
  }

  if (isForceNeutralLine(filePath, sourceLines, lineNumber)) {
    return 'neutral';
  }

  const singleLineEmptyBlockFunctionStatus = getSingleLineEmptyBlockFunctionStatus(fileCoverage, sourceLines, lineNumber);
  if (singleLineEmptyBlockFunctionStatus) {
    return singleLineEmptyBlockFunctionStatus;
  }

  const directCoveredStatementCount = getDirectStatementCountOnLine(fileCoverage, lineNumber);
  if (directCoveredStatementCount != null && directCoveredStatementCount > 0) {
    return 'yes';
  }

  const lineCount = getLineCoverageCount(fileCoverage, lineNumber);
  if (lineCount != null) {
    if (lineCount > 0) {
      if (shouldSuppressCoveredLineInFunctionWithoutLocalExecution(fileCoverage, filePath, sourceLines, lineNumber)
        || isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)
        || shouldHardSuppressZeroCountLambdaLine(fileCoverage, sourceLines, lineNumber)
        || isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)) {
        return 'no';
      }
      return 'yes';
    }

    // Lines inside an uncovered catch block should never be promoted —
    // the catch path was never executed, so any positive count in lineCoverage
    // is an artifact of promote rules that inferred coverage from the try path.
    if (isLineInUncoveredCatchBlock(fileCoverage, filePath, sourceLines, lineNumber)
      || isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)
      || shouldHardSuppressZeroCountLambdaLine(fileCoverage, sourceLines, lineNumber)
      || isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)) {
      return 'no';
    }

    const promotedWhenArmStatus = getPromotedWhenArmHeaderStatus(fileCoverage, sourceLines, lineNumber);
    if (promotedWhenArmStatus) {
      return promotedWhenArmStatus;
    }

    const promotedExpressionBodiedFunctionStatus = getPromotedExpressionBodiedFunctionStatus(fileCoverage, sourceLines, lineNumber);
    if (promotedExpressionBodiedFunctionStatus) {
      return promotedExpressionBodiedFunctionStatus;
    }

    const promotedExpressionBodiedAccessorStatus = getPromotedExpressionBodiedAccessorStatus(fileCoverage, sourceLines, lineNumber);
    if (promotedExpressionBodiedAccessorStatus) {
      return promotedExpressionBodiedAccessorStatus;
    }

    const promotedDataClassHeaderStatus = getPromotedDataClassHeaderStatus(fileCoverage, sourceLines, lineNumber);
    if (promotedDataClassHeaderStatus) {
      return promotedDataClassHeaderStatus;
    }

    const promotedCoveredControlHeaderStatus = getPromotedCoveredControlHeaderStatus(fileCoverage, sourceLines, lineNumber);
    if (promotedCoveredControlHeaderStatus) {
      return promotedCoveredControlHeaderStatus;
    }

    const promotedMultilineControlConditionContinuationStatus = getPromotedMultilineControlConditionContinuationStatus(fileCoverage, sourceLines, lineNumber);
    if (promotedMultilineControlConditionContinuationStatus) {
      return promotedMultilineControlConditionContinuationStatus;
    }

    const promotedCoveredFunctionStatementStatus = getPromotedCoveredFunctionStatementStatus(fileCoverage, filePath, sourceLines, lineNumber);
    if (promotedCoveredFunctionStatementStatus) {
      return promotedCoveredFunctionStatementStatus;
    }

    const promotedSimpleStatementInCalledFunctionStatus = getPromotedSimpleStatementInCalledFunctionStatus(fileCoverage, filePath, sourceLines, lineNumber);
    if (promotedSimpleStatementInCalledFunctionStatus) {
      return promotedSimpleStatementInCalledFunctionStatus;
    }

    const promotedInitializedPropertyHeaderStatus = getPromotedInitializedPropertyHeaderStatus(fileCoverage, filePath, sourceLines, lineNumber);
    if (promotedInitializedPropertyHeaderStatus) {
      return promotedInitializedPropertyHeaderStatus;
    }

    // Block function header lines are structural neutral (handled by
    // isForceNeutralLine at the top of deriveLineStatus), so their
    // promote logic is never reached here.

    const promotedMultilineControlHeaderStatus = getPromotedMultilineControlHeaderStatus(fileCoverage, filePath, sourceLines, lineNumber);
    if (promotedMultilineControlHeaderStatus) {
      return promotedMultilineControlHeaderStatus;
    }

    const promotedControlStatus = getPromotedControlLineStatus(fileCoverage, filePath, sourceLines, lineNumber);
    if (promotedControlStatus) {
      return promotedControlStatus;
    }

    return 'no';
  }

  // Lines inside an uncovered catch block should never be promoted —
  // the catch path was never executed.
  if (isLineInUncoveredCatchBlock(fileCoverage, filePath, sourceLines, lineNumber)
    || isLineInReliablyUncoveredBranchArm(fileCoverage, lineNumber)
    || shouldHardSuppressZeroCountLambdaLine(fileCoverage, sourceLines, lineNumber)
    || isLineInReliablyUncoveredInlineWhenArm(fileCoverage, sourceLines, lineNumber)) {
    return 'no';
  }

  const promotedExpressionBodiedFunctionStatus = getPromotedExpressionBodiedFunctionStatus(fileCoverage, sourceLines, lineNumber);
  if (promotedExpressionBodiedFunctionStatus) {
    return promotedExpressionBodiedFunctionStatus;
  }

  const promotedExpressionBodiedAccessorStatus = getPromotedExpressionBodiedAccessorStatus(fileCoverage, sourceLines, lineNumber);
  if (promotedExpressionBodiedAccessorStatus) {
    return promotedExpressionBodiedAccessorStatus;
  }

  const promotedDataClassHeaderStatus = getPromotedDataClassHeaderStatus(fileCoverage, sourceLines, lineNumber);
  if (promotedDataClassHeaderStatus) {
    return promotedDataClassHeaderStatus;
  }

  const promotedCoveredFunctionStatementStatus = getPromotedCoveredFunctionStatementStatus(fileCoverage, filePath, sourceLines, lineNumber);
  if (promotedCoveredFunctionStatementStatus) {
    return promotedCoveredFunctionStatementStatus;
  }

  const promotedSimpleStatementInCalledFunctionStatus = getPromotedSimpleStatementInCalledFunctionStatus(fileCoverage, filePath, sourceLines, lineNumber);
  if (promotedSimpleStatementInCalledFunctionStatus) {
    return promotedSimpleStatementInCalledFunctionStatus;
  }

  const promotedInitializedPropertyHeaderStatus = getPromotedInitializedPropertyHeaderStatus(fileCoverage, filePath, sourceLines, lineNumber);
  if (promotedInitializedPropertyHeaderStatus) {
    return promotedInitializedPropertyHeaderStatus;
  }

  const lineText = getLineText(sourceLines, lineNumber);
  const branchStat = branchStats.get(lineNumber);
  if (!branchStat || !isPartialControlLine(lineText)) {
    // Lines with no Istanbul mapping that are clearly executable code inside a
    // function body should be 'no' (uncovered), not 'neutral'. This prevents
    // when-arm bodies and other executable lines without sourcemap entries from
    // being incorrectly shown as neutral/gray.
    if (isLikelyExecutableLine(lineText) && findEnclosingBlockFunctionRange(sourceLines, lineNumber)) {
      return 'no';
    }
    return 'neutral';
  }

  if (branchStat.covered > 0 && branchStat.uncovered > 0) {
    return 'partial';
  }

  if (branchStat.uncovered > 0) {
    return 'no';
  }

  if (branchStat.covered > 0) {
    return 'yes';
  }

  return 'neutral';
}

function inferLineCountFromFunctions(fileCoverage, lineNumber) {
  for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
    const count = Number(fileCoverage.f?.[functionId] || 0);
    if (count <= 0) {
      continue;
    }
    const loc = functionCoverage.loc;
    if (loc?.start?.line && loc?.end?.line
      && lineNumber >= loc.start.line && lineNumber <= loc.end.line) {
      return count;
    }
    const decl = functionCoverage.decl;
    if (decl?.start?.line && decl?.end?.line
      && lineNumber >= decl.start.line && lineNumber <= decl.end.line) {
      return count;
    }
  }
  return null;
}

function inferLineCountFromBranches(fileCoverage, lineNumber) {
  let maxCount = null;
  for (const [branchId, branchCoverage] of Object.entries(fileCoverage.branchMap || {})) {
    const loc = branchCoverage.loc;
    if (!loc?.start?.line || !loc?.end?.line) {
      continue;
    }
    if (lineNumber < loc.start.line || lineNumber > loc.end.line) {
      continue;
    }
    const counts = fileCoverage.b?.[branchId] || [];
    const branchMax = Math.max(...counts.map((c) => Number(c || 0)), 0);
    if (branchMax > 0 && (maxCount == null || branchMax > maxCount)) {
      maxCount = branchMax;
    }
  }
  return maxCount;
}

function buildKotlinHtmlLineDataMap(coverageData) {
  const lineDataMap = new Map();

  for (const [filePath, fileCoverage] of Object.entries(coverageData)) {
    if (!filePath.endsWith('.kt')) {
      continue;
    }

    const sourceLines = getSourceLines(filePath);
    const branchStats = buildBranchLineStats(fileCoverage);
    const lineStatuses = Array.from(
      { length: sourceLines.length },
      (_, index) => deriveLineStatus(fileCoverage, filePath, sourceLines, index + 1, branchStats),
    );
    const lineCounts = Array.from(
      { length: sourceLines.length },
      (_, index) => getLineCoverageCount(fileCoverage, index + 1),
    );

    // Fill in missing counts for promoted "yes" lines — lines where deriveLineStatus
    // inferred coverage from function/branch data but fc.l has no entry. Use the
    // function execution count if the line is within a covered function's range,
    // otherwise fall back to branch covered count.
    for (let i = 0; i < lineStatuses.length; i++) {
      if (lineStatuses[i] !== 'yes' || lineCounts[i] != null) {
        continue;
      }
      const lineNumber = i + 1;
      const inferredCount = inferLineCountFromFunctions(fileCoverage, lineNumber)
        ?? inferLineCountFromBranches(fileCoverage, lineNumber);
      if (inferredCount != null) {
        lineCounts[i] = inferredCount;
      }
    }

    lineDataMap.set(getReportRelativeSourcePath(filePath), {
      statuses: lineStatuses,
      counts: lineCounts,
    });
  }

  return lineDataMap;
}

function shouldRemoveFunctionMapping(functionCoverage, count, sourceLines) {
  const name = functionCoverage?.name || '';
  const locLineText = getLineText(sourceLines, functionCoverage?.loc?.start?.line);
  const declLineText = getLineText(sourceLines, functionCoverage?.decl?.start?.line);

  if (syntheticAccessorNamePattern.test(name)) {
    return true;
  }

  // Object/class <init> functions are JVM/JS class-loader artifacts, not real
  // Kotlin functions. They always execute (count > 0) when the class is loaded,
  // but their execution is not under test control. Remove them regardless of count.
  if (/<init>/u.test(name)) {
    return true;
  }

  // Kotlin $default methods are compiler-generated synthetic methods for
  // default parameter handling. They are not real Kotlin functions and their
  // execution is not under test control. Remove them regardless of count.
  if (syntheticDefaultMethodNamePattern.test(name)) {
    return true;
  }

  if (count !== 0) {
    return false;
  }

  if (isPropertyAccessorLine(locLineText)) {
    return true;
  }

  const declarationLike = isClassSignatureLine(locLineText)
    || isPrimaryConstructorPropertyLine(locLineText)
    || isNonRuntimePropertyDeclaration(locLineText)
    || isNonRuntimePropertyDeclaration(declLineText);

  if (!declarationLike) {
    return false;
  }

  return !/\bfun\b/u.test(locLineText) && !/\bfun\b/u.test(declLineText);
}

function shouldRemoveStatementMapping(lineText, startLine, count, syntheticAccessorLines, filePath, sourceLines) {
  if (isClassSignatureLine(lineText)) {
    return true;
  }

  if (isPrimaryConstructorPropertyLine(lineText)) {
    return !isRuntimeInitializedPrimaryConstructorPropertyLine(lineText);
  }

  // A block-function header line (`fun ... {`) is not an executable statement —
  // it is the function's entry-point marker. Regardless of count, treat it as
  // neutral so it does not inflate or deflate coverage metrics.
  if (isBlockFunctionHeaderLine(lineText)) {
    return true;
  }

  // Multi-line function header lines (the `fun` start line, parameter
  // continuation lines, and the closing `): Type {` line) are also not
  // executable statements. Use isForceNeutralLine which tracks inFunctionHeader.
  if (filePath && sourceLines && isForceNeutralLine(filePath, sourceLines, startLine)) {
    return true;
  }

  return syntheticAccessorLines.has(startLine) && isNonRuntimePropertyDeclaration(lineText);
}

function shouldRemoveBranchMapping(lineText, lineNumber, branchCounts, syntheticAccessorLines) {
  const isAllZero = branchCounts.every((count) => Number(count || 0) === 0);
  if (!isAllZero) {
    return false;
  }

  if (isClassSignatureLine(lineText)) {
    return true;
  }

  if (isPrimaryConstructorPropertyLine(lineText)) {
    return !isRuntimeInitializedPrimaryConstructorPropertyLine(lineText);
  }

  return syntheticAccessorLines.has(lineNumber) && isNonRuntimePropertyDeclaration(lineText);
}

function postProcessKotlinCoverage(coverageData) {
  const patchedCoverageData = cloneCoverageData(coverageData);
  const stats = {
    removedFunctions: 0,
    removedStatements: 0,
    removedBranches: 0,
  };

  for (const [filePath, fileCoverage] of Object.entries(patchedCoverageData)) {
    if (!filePath.endsWith('.kt')) {
      continue;
    }

    const sourceLines = getSourceLines(filePath);
    const syntheticAccessorLines = new Set();

    for (const [functionId, functionCoverage] of Object.entries(fileCoverage.fnMap || {})) {
      const count = Number(fileCoverage.f?.[functionId] || 0);
      if (!shouldRemoveFunctionMapping(functionCoverage, count, sourceLines)) {
        continue;
      }

      for (const line of getRangeLines(functionCoverage.loc)) {
        syntheticAccessorLines.add(line);
      }

      delete fileCoverage.fnMap[functionId];
      delete fileCoverage.f[functionId];
      stats.removedFunctions += 1;
    }

    for (const [statementId, statementCoverage] of Object.entries(fileCoverage.statementMap || {})) {
      const startLine = statementCoverage?.start?.line;
      const lineText = getLineText(sourceLines, startLine);
      const statementCount = Number(fileCoverage.s?.[statementId] || 0);
      if (!shouldRemoveStatementMapping(lineText, startLine, statementCount, syntheticAccessorLines, filePath, sourceLines)) {
        continue;
      }

      delete fileCoverage.statementMap[statementId];
      delete fileCoverage.s[statementId];
      stats.removedStatements += 1;
    }

    for (const [branchId, branchCoverage] of Object.entries(fileCoverage.branchMap || {})) {
      const lineNumber = branchCoverage?.line || branchCoverage?.locations?.[0]?.start?.line;
      const lineText = getLineText(sourceLines, lineNumber);
      const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];

      let shouldRemove = shouldRemoveBranchMapping(lineText, lineNumber, branchCounts, syntheticAccessorLines);

      if (!shouldRemove) {
        // Also remove branches whose primary line is structural/neutral — these are source-map
        // artefacts (e.g. lateinit initialization checks, class-header null-safety guards) that
        // map back to property or class declaration lines. Keeping them inflates the "not covered"
        // branch count with arms that are invisible in the HTML report.
        if (isForceNeutralLine(filePath, sourceLines, lineNumber)) {
          shouldRemove = true;
        }
      }

      if (!shouldRemove) {
        // Remove all-zero-count branches on lines that ARE executed. These are source-map remap
        // artefacts where the JS-level branch (e.g. compiled try/catch, safe-call null-guard) does
        // not round-trip cleanly through the source map — the line has execution count > 0 but no
        // branch arm was ever recorded as taken. Such phantom branches inflate the "uncovered"
        // branch count without corresponding visible indicators in the HTML report.
        const isAllZero = branchCounts.every((count) => Number(count || 0) === 0);
        if (isAllZero) {
          const rawLineCount = fileCoverage.l?.[lineNumber] ?? fileCoverage.l?.[String(lineNumber)];
          if (Number(rawLineCount || 0) > 0) {
            shouldRemove = true;
          } else {
            // Check if any covered statement overlaps the branch's location range.
            // A spanning statement (e.g. return try { ... } catch { ... }) can cover
            // lines within the branch range without starting on the branch line,
            // and fc.l may not have entries for those intermediate lines.
            const branchStartLine = branchCoverage.loc?.start?.line ?? lineNumber;
            const branchEndLine = branchCoverage.loc?.end?.line ?? lineNumber;
            const hasOverlappingCoveredStatement = Object.entries(fileCoverage.statementMap || {}).some(
              ([statementId, loc]) => {
                if (Number(fileCoverage.s?.[statementId] || 0) <= 0) {
                  return false;
                }
                const sStart = loc?.start?.line;
                const sEnd = loc?.end?.line;
                return sStart != null && sEnd != null
                  && sStart <= branchEndLine && sEnd >= branchStartLine;
              },
            );
            if (hasOverlappingCoveredStatement) {
              shouldRemove = true;
            }
          }
        }
      }

      if (!shouldRemove) {
        continue;
      }

      delete fileCoverage.branchMap[branchId];
      delete fileCoverage.b[branchId];
      stats.removedBranches += 1;
    }

    fileCoverage.l = computeLineCoverageFromStatements(fileCoverage, filePath, sourceLines);

    if (filePath.includes('FastMutableList.kt')) {
    }
  }

  return {
    coverageData: patchedCoverageData,
    stats,
  };
}

function createIstanbulContext(coverageData) {
  const coverageMap = istanbulLibCoverage.createCoverageMap(coverageData);
  return istanbulLibReport.createContext({
    coverageMap,
    defaultSummarizer: 'nested',
    dir: reportDir,
    watermarks: coverageConfig.watermarks,
    sourceFinder: (filePath) => {
      if (existsSync(filePath)) {
        return readFileSync(filePath, 'utf8');
      }
      return `Not found source file: ${filePath}`;
    },
  });
}

function regenerateIstanbulReportsFromCoverageData(coverageData) {
  const context = createIstanbulContext(coverageData);
  for (const [reportName, reportOptions] of getIstanbulReportEntries()) {
    const report = istanbulReports.create(reportName, reportOptions || {});
    report.execute(context);
  }

  // Istanbul's json-summary reporter computes lines from statementMap rather than
  // fc.l, which overcounts lines because statementMap entries can span closing
  // braces, const declarations, and other structural-neutral lines that our
  // post-processing has already removed from fc.l.  Rewrite the lines totals in
  // coverage-summary.json using the authoritative fc.l data.
  patchSummaryLinesFromLineCoverage(coverageData);
}

function patchSummaryLinesFromLineCoverage(coverageData) {
  const summaryPath = join(reportDir, 'coverage-summary.json');
  if (!existsSync(summaryPath)) {
    return;
  }

  const summary = readJson(summaryPath);

  for (const [filePath, fc] of Object.entries(coverageData)) {
    if (!filePath.endsWith('.kt')) {
      continue;
    }

    const fileSummary = summary[filePath];
    if (!fileSummary) {
      continue;
    }

    let covered = 0;
    let total = 0;
    for (const line of Object.keys(fc.l || {})) {
      const count = Number(fc.l[line] || 0);
      total += 1;
      if (count > 0) {
        covered += 1;
      }
    }

    if (total > 0) {
      fileSummary.lines = {
        total,
        covered,
        skipped: 0,
        pct: roundPct(total > 0 ? (covered / total) * 100 : 0),
      };
    }
  }

  // Recompute the global total from patched per-file summaries.
  // Also round all pct values to 2 decimal places for consistency.
  const metrics = ['lines', 'branches', 'functions'];
  const globalTotal = {};
  for (const m of metrics) {
    globalTotal[m] = { total: 0, covered: 0, skipped: 0 };
  }

  for (const [filePath, fileSummary] of Object.entries(summary)) {
    if (filePath === 'total') {
      continue;
    }
    for (const m of metrics) {
      globalTotal[m].total += fileSummary[m]?.total || 0;
      globalTotal[m].covered += fileSummary[m]?.covered || 0;
      globalTotal[m].skipped += fileSummary[m]?.skipped || 0;
      // Round per-file pct to 2 decimal places
      if (fileSummary[m]?.pct != null) {
        fileSummary[m].pct = roundPct(fileSummary[m].pct);
      }
    }
  }

  for (const m of metrics) {
    const g = globalTotal[m];
    g.pct = roundPct(g.total > 0 ? (g.covered / g.total) * 100 : 0);
  }

  summary.total = globalTotal;
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
}

function appendCssPatch(filePath, marker, patchContent) {
  if (!existsSync(filePath)) {
    return;
  }

  const css = readFileSync(filePath, 'utf8');
  if (css.includes(marker)) {
    return;
  }

  writeFileSync(filePath, `${css.trimEnd()}\n\n${marker}\n${patchContent}\n`);
}

function patchCoverageCss() {
  appendCssPatch(
    join(reportDir, 'base.css'),
    customBaseCssMarker,
    [
      'td.line-coverage .cline-no { background: #ff6b81 !important; color: #fff !important; font-weight: 700; }',
      'td.line-coverage .cline-yes { background: #7bdc65 !important; color: #0f3a16 !important; font-weight: 700; }',
      'td.line-coverage .cline-neutral { background: #d9d9d9 !important; color: #666 !important; }',
      'td.line-coverage .cline-partial { background: #ffe8a3 !important; color: #6b4e00 !important; font-weight: 700; }',
      '.kotlin-line { display: block; line-height: inherit; }',
      '.kotlin-line.coverage-yes { background: #d8f3cf; color: #225c2a; }',
      '.kotlin-line.coverage-no { background: #ffd7de; color: #8a2435; }',
      '.kotlin-line.coverage-partial { background: #fff1bf; color: #6b4e00; }',
      '.kotlin-line.coverage-neutral { background: transparent; }',
    ].join('\n'),
  );

  appendCssPatch(
    join(reportDir, 'spa.css'),
    customSpaCssMarker,
    [
      '.low { background: #ffd7de; }',
      '.low--dark { background: #d7263d; }',
      '.medium { background: #ffe8a3; }',
      '.high { background: #def2c7; }',
      '.high--dark { background: #3c9a28; }',
    ].join('\n'),
  );
}

const customBundleFilterMarker = '/* kuiklyui-filter-patch */';

function patchBundleFilterLogic() {
  const bundlePath = join(reportDir, 'bundle.js');
  if (!existsSync(bundlePath)) {
    return;
  }

  let bundleContent = readFileSync(bundlePath, 'utf8');

  // The original Monocart filter uses per-metric OR: a file is shown if ANY visible
  // metric's classForPercent matches the active filter.  This means toggling "medium"
  // has no visible effect when "low" and "high" are already selected, because files
  // with medium branches but high lines still pass via the "high" check.
  //
  // Replace with file-level classForPercent filtering: compute the worst classForPercent
  // across visible metrics (same logic Monocart uses for the file row colour), then
  // check that single value against the active filters.  This makes Low / Medium / High
  // behave as mutually exclusive tiers.
  const originalPerMetricFilter = 'n.branches&&r[a.metrics.branches.classForPercent]||n.functions&&r[a.metrics.functions.classForPercent]||n.lines&&r[a.metrics.lines.classForPercent]';

  if (!bundleContent.includes(originalPerMetricFilter)) {
    return;
  }

  const fileLevelFilter = [
    'r[function(){',
    'var v="none",hasMetric=false;',
    'if(n.branches){var b=a.metrics.branches.classForPercent;if(b!=="none"&&b!=="empty"){hasMetric=true;if(b==="low"||b==="medium"&&v!=="low"||b==="high"&&v!=="low"&&v!=="medium")v=b}}',
    'if(n.functions){var f=a.metrics.functions.classForPercent;if(f!=="none"&&f!=="empty"){hasMetric=true;if(f==="low"||f==="medium"&&v!=="low"||f==="high"&&v!=="low"&&v!=="medium")v=f}}',
    'if(n.lines){var l=a.metrics.lines.classForPercent;if(l!=="none"&&l!=="empty"){hasMetric=true;if(l==="low"||l==="medium"&&v!=="low"||l==="high"&&v!=="low"&&v!=="medium")v=l}}',
    'return hasMetric?v:"empty"}()]',
  ].join('');

  bundleContent = bundleContent.replace(originalPerMetricFilter, fileLevelFilter);
  writeFileSync(bundlePath, bundleContent);
}

function patchHtmlSpaIndexDefaults() {
  const htmlSpaIndexPath = join(reportDir, 'index.html');
  if (!existsSync(htmlSpaIndexPath)) {
    return;
  }

  let indexHtml = readFileSync(htmlSpaIndexPath, 'utf8');

  // Patch metricsToShow and default hash
  const metricsPatched = indexHtml.replace(
    /window\.metricsToShow = .*?;/,
    `window.metricsToShow = ${JSON.stringify(htmlSpaMetricsToShow)};\n                        if (!window.location.hash) {\n                            window.history.replaceState(null, '', ${JSON.stringify(htmlSpaDefaultHash)});\n                        }`,
  );
  if (metricsPatched !== indexHtml) {
    indexHtml = metricsPatched;
  }

  // Patch window.data lines metrics from fc.l instead of Istanbul's statementMap-derived values.
  // Monocart's html-spa reporter computes lines from the statementMap (via Istanbul's
  // getLineCoverage()), which overcounts by including closing braces, const declarations,
  // and other structural-neutral lines.  Replace with the authoritative fc.l counts that
  // our post-processing has already produced.
  const coverageFinalPath = join(reportDir, 'coverage-final.json');
  if (existsSync(coverageFinalPath)) {
    const coverageData = readJson(coverageFinalPath);
    const dataMatch = indexHtml.match(/window\.data\s*=\s*(\{[\s\S]*?\});/);
    if (dataMatch) {
      try {
        const spaData = JSON.parse(dataMatch[1]);
        patchSpaDataLinesFromCoverage(spaData, coverageData);
        const patchedDataStr = `window.data = ${JSON.stringify(spaData)};`;
        indexHtml = indexHtml.replace(dataMatch[0], patchedDataStr);
      } catch {
        // Non-fatal: if JSON parsing fails, leave the SPA data as-is
      }
    }
  }

  writeFileSync(htmlSpaIndexPath, indexHtml);
}

function patchSpaDataLinesFromCoverage(spaData, coverageData) {
  // Build a lookup: path relative to scopeRoot parent → coverageData entry.
  // SPA paths are like "base/src/jsMain/.../Foo.kt" (without the "core-render-web/" prefix),
  // so we strip the scopeRootAnchor from the coverage data key to match.
  const coverageLookup = new Map();
  for (const [filePath, fc] of Object.entries(coverageData)) {
    if (!filePath.endsWith('.kt')) {
      continue;
    }
    const normalized = filePath.replace(/\\/g, '/');
    for (const scopeRoot of coverageConfig.scopeRoots) {
      const anchor = scopeRoot.replace(/\\/g, '/');
      const idx = normalized.indexOf('/' + anchor);
      if (idx !== -1) {
        // Remove the scopeRootAnchor prefix (e.g. "core-render-web/")
        // to get a path like "base/src/jsMain/.../Foo.kt" that matches SPA tree paths
        const scopeRootAnchorPrefix = scopeRootAnchor.replace(/\\/g, '/');
        const afterAnchor = normalized.slice(idx + 1); // e.g. "core-render-web/base/src/..."
        const relPath = afterAnchor.startsWith(scopeRootAnchorPrefix)
          ? afterAnchor.slice(scopeRootAnchorPrefix.length)
          : afterAnchor;
        coverageLookup.set(relPath, fc);
        break;
      }
    }
  }

  const patchNode = (node, parentPath) => {
    const currentPath = parentPath ? `${parentPath}/${node.file}` : node.file;
    if (node.metrics && node.file && !node.children) {
      const fc = coverageLookup.get(currentPath);
      if (fc) {
        let covered = 0;
        let total = 0;
        for (const line of Object.keys(fc.l || {})) {
          total += 1;
          if (Number(fc.l[line]) > 0) {
            covered += 1;
          }
        }
        if (total > 0) {
          const missed = total - covered;
          const pct = roundPct((covered / total) * 100);
          node.metrics.lines = {
            total,
            covered,
            skipped: 0,
            missed,
            pct,
            classForPercent: getClassForPercent(pct, 'lines'),
          };
        }
      }
    }
    if (node.children) {
      node.children.forEach((child) => patchNode(child, currentPath));
      if (node.metrics && node.children) {
        reaggregateMetricsFromChildren(node);
      }
    }
  };

  patchNode(spaData, '');
}

function roundPct(pct) {
  return Math.round(pct * 100) / 100;
}

function getClassForPercent(pct, metricName) {
  const watermarks = coverageConfig.watermarks[metricName] || [50, 80];
  if (pct < watermarks[0]) return 'low';
  if (pct < watermarks[1]) return 'medium';
  return 'high';
}

function reaggregateMetricsFromChildren(node) {
  const metrics = ['branches', 'functions', 'lines'];
  for (const m of metrics) {
    let total = 0;
    let covered = 0;
    for (const child of node.children) {
      if (child.metrics?.[m]) {
        total += child.metrics[m].total || 0;
        covered += child.metrics[m].covered || 0;
      }
    }
    if (total > 0) {
      const pct = roundPct((covered / total) * 100);
      node.metrics[m] = {
        total,
        covered,
        skipped: 0,
        missed: total - covered,
        pct,
        classForPercent: getClassForPercent(pct, m),
      };
    }
  }
}

function walkReportHtmlFiles(currentDir, results = []) {
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    const entryPath = join(currentDir, entry.name);
    if (entry.isDirectory()) {
      walkReportHtmlFiles(entryPath, results);
      continue;
    }

    if (/\.kts?\.html$/u.test(entry.name)) {
      results.push(entryPath);
    }
  }

  return results;
}

function extractLineStatuses(lineCoverageHtml) {
  return lineCoverageHtml
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.match(/cline-(yes|no|neutral|partial)/u)?.[1] || 'neutral');
}

function getHtmlReportRelativeSourcePath(htmlPath) {
  return relative(reportDir, htmlPath).replace(/\\/g, '/').replace(/\.html$/u, '');
}

function resolveLineStatuses(lineCoverageHtml, computedLineStatuses) {
  const fallbackStatuses = extractLineStatuses(lineCoverageHtml);
  if (!Array.isArray(computedLineStatuses) || computedLineStatuses.length !== fallbackStatuses.length) {
    return fallbackStatuses;
  }
  return computedLineStatuses;
}

function getPatchedLineCoverageText(status, count) {
  if (status === 'neutral') {
    return '&nbsp;';
  }

  if ((status === 'yes' || status === 'partial') && Number(count) > 0) {
    return `${Number(count)}x`;
  }

  return '&nbsp;';
}

function patchLineCoverageHtml(lineCoverageHtml, lineStatuses, lineCounts) {
  const coverageLines = lineCoverageHtml.replace(/\r\n/g, '\n').split('\n');
  if (coverageLines.length !== lineStatuses.length) {
    return lineCoverageHtml;
  }

  const normalizedLineCounts = Array.isArray(lineCounts) && lineCounts.length === coverageLines.length
    ? lineCounts
    : null;

  return coverageLines.map((lineHtml, index) => {
    const status = lineStatuses[index] || 'neutral';
    const count = normalizedLineCounts?.[index];
    let patchedLineHtml = lineHtml.replace(/cline-(?:yes|no|neutral|partial)/gu, `cline-${status}`);
    patchedLineHtml = patchedLineHtml.replace(/>[^<]*<\/span>/u, `>${getPatchedLineCoverageText(status, count)}</span>`);
    return patchedLineHtml;
  }).join('\n');
}

function simplifyAnnotatedKotlinCode(codeHtml, lineStatuses) {
  const plainCodeHtml = codeHtml
    .replace(/<span class="[^"]*(?:cstat-|fstat-|cbranch-|branch-)[^"]*"[^>]*>/gu, '')
    .replace(/<\/span>/gu, '');

  const codeLines = plainCodeHtml.replace(/\r\n/g, '\n').split('\n');
  if (codeLines.length !== lineStatuses.length) {
    return null;
  }

  return codeLines.map((line, index) => {
    const status = lineStatuses[index] || 'neutral';
    const lineHtml = line || '&nbsp;';
    return `<span class="kotlin-line coverage-${status}">${lineHtml}</span>`;
  }).join('');
}

function patchDetailHtmlHeaderMetrics(html, computedLineData) {
  if (!computedLineData) {
    return html;
  }

  // Use fc.l counts (same as coverage-summary.json) rather than
  // deriveLineStatus counts, so the header metrics stay consistent
  // with the summary data.
  const counts = computedLineData.counts;
  const statuses = computedLineData.statuses;
  if (!counts || !statuses) {
    return html;
  }

  let covered = 0;
  let total = 0;
  for (let i = 0; i < counts.length; i++) {
    const count = counts[i];
    const status = statuses[i];
    // Only count lines that have a lineCoverage entry in fc.l
    // (count != null) — neutral lines without an entry are excluded.
    if (count != null) {
      total++;
      if (Number(count) > 0) {
        covered++;
      }
    }
  }

  if (total === 0) {
    return html;
  }

  const pct = roundPct((covered / total) * 100);

  // Replace Lines fraction: <span class='fraction'>44/53</span>
  html = html.replace(
    /(<span class="quiet">Lines<\/span>[\s\S]*?<span class='fraction'>)\d+\/\d+(<\/span>)/,
    `$1${covered}/${total}$2`,
  );

  // Replace Lines percentage
  html = html.replace(
    /(<span class="strong">)\s*[\d.]+%\s*(<\/span>\s*<span class="quiet">Lines<\/span>)/,
    `$1${pct}% $2`,
  );

  // Update status-line class
  const watermarks = coverageConfig.watermarks.lines || [70, 80];
  const statusClass = pct < watermarks[0] ? 'low' : pct < watermarks[1] ? 'medium' : 'high';
  html = html.replace(
    /(<div class='status-line\s+)(?:low|medium|high)('><\/div>)/,
    `$1${statusClass}$2`,
  );

  return html;
}

function patchKotlinDetailHtmlFiles(lineDataMap) {
  if (!existsSync(reportDir)) {
    return 0;
  }

  let patchedCount = 0;
  const htmlFiles = walkReportHtmlFiles(reportDir);
  const detailBlockPattern = /<td class="line-coverage quiet">([\s\S]*?)<\/td><td class="text"><pre class="prettyprint(?:\s+lang-js)?">([\s\S]*?)<\/pre><\/td><\/tr>/u;

  for (const htmlPath of htmlFiles) {
    let html = readFileSync(htmlPath, 'utf8');
    const computedLineData = lineDataMap?.get(getHtmlReportRelativeSourcePath(htmlPath));
    const computedLineStatuses = computedLineData?.statuses;
    const computedLineCounts = computedLineData?.counts;

    // Patch header metrics: replace Lines fraction and pct from computed statuses
    html = patchDetailHtmlHeaderMetrics(html, computedLineData);

    // Remove Statements metric block from detail page header (JS-level metric, not meaningful for Kotlin)
    html = html.replace(/<div class='fl pad1y space-right2'>\s*<span class="strong">[\d.]+%\s*<\/span>\s*<span class="quiet">Statements<\/span>\s*<span class='fraction'>\d+\/\d+<\/span>\s*<\/div>\s*/gu, '');

    const patchedHtml = html.replace(detailBlockPattern, (match, lineCoverageHtml, codeHtml) => {
      const lineStatuses = resolveLineStatuses(lineCoverageHtml, computedLineStatuses);
      const patchedLineCoverageHtml = patchLineCoverageHtml(lineCoverageHtml, lineStatuses, computedLineCounts);
      const simplifiedCodeHtml = simplifyAnnotatedKotlinCode(codeHtml, lineStatuses);
      if (!simplifiedCodeHtml) {
        return `<td class="line-coverage quiet">${patchedLineCoverageHtml}</td><td class="text"><pre class="prettyprint lang-kotlin">${codeHtml}</pre></td></tr>`;
      }

      return `<td class="line-coverage quiet">${patchedLineCoverageHtml}</td><td class="text"><pre class="prettyprint lang-kotlin">${simplifiedCodeHtml}</pre></td></tr>`;
    });

    if (patchedHtml !== html) {
      writeFileSync(htmlPath, patchedHtml);
      patchedCount += 1;
    }
  }

  return patchedCount;
}

function postProcessCoverageArtifacts() {
  const coverageFinalPath = join(reportDir, 'coverage-final.json');
  if (!existsSync(coverageFinalPath)) {
    return null;
  }

  const coverageData = readJson(coverageFinalPath);
  const { coverageData: patchedCoverageData, stats } = postProcessKotlinCoverage(coverageData);
  const lineDataMap = buildKotlinHtmlLineDataMap(patchedCoverageData);
  regenerateIstanbulReportsFromCoverageData(patchedCoverageData);
  writeFileSync(coverageFinalPath, JSON.stringify(patchedCoverageData));

  if (!checkOnly) {
    patchHtmlSpaIndexDefaults();
    patchCoverageCss();
    patchBundleFilterLogic();
    const patchedHtmlFiles = patchKotlinDetailHtmlFiles(lineDataMap);
    return {
      ...stats,
      patchedHtmlFiles,
    };
  }

  return {
    ...stats,
    patchedHtmlFiles: 0,
  };
}

function getCoverageOptions() {
  return {
    name: 'Kuikly Web Kotlin Coverage',
    outputDir: reportDir,
    baseDir: projectRoot,
    clean: !checkOnly,
    logging: 'off',
    v8Ignore: true,
    watermarks: coverageConfig.watermarks,
    reports: getIstanbulReportEntries(),
    entryFilter: (entry) => isTargetModuleName(getEntryFileName(entry.url)),
    sourceFilter: (sourcePath) => isInCoverageScope(sourcePath),
    sourcePath: resolveSourcePath,
    all: coverageScopeRoots,
  };
}

async function main() {
  const rawEntries = readRawCoverageEntries();
  const coverageEntries = prepareEntriesForKotlinReport(rawEntries);

  if (!coverageEntries.length) {
    throw new Error('No V8 coverage entries matched the Kotlin target modules');
  }

  const mcr = MCR(getCoverageOptions());
  await mcr.add(coverageEntries);
  const coverageResults = await mcr.generate();
  const postProcessStats = postProcessCoverageArtifacts();

  if (postProcessStats) {
    console.log('[coverage] Applied Kotlin coverage post-processing:', postProcessStats);
  }

  if (checkOnly) {
    assertCoverageThresholds(readIstanbulSummaryTotal());
    console.log('Coverage thresholds passed');
    return;
  }

  console.log(`Coverage report generated: ${coverageResults.reportPath}`);
}

await main();
