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
const targetModuleSet = new Set(coverageConfig.targetModules);
const distFileCache = new Map();
const sourceMapCache = new Map();
const sourceLineCache = new Map();
const structuralNeutralLineCache = new Map();
const checkOnly = process.argv.includes('--check');
const htmlSpaMetricsToShow = ['statements', 'lines', 'branches', 'functions'];
const htmlSpaDefaultHash = '#file/desc/true/true/true/true//';
const syntheticAccessorNamePattern = /^(?:<get-|<set-|_get_|_set_)/;
const classSignatureLinePattern = /^\s*(?:(?:public|private|protected|internal|open|final|abstract|sealed|data|enum|annotation|value|inner|expect|actual|companion)\s+)*(?:class|interface|object)\b/;
const propertyDeclarationLinePattern = /^\s*(?:(?:public|private|protected|internal|open|final|abstract|sealed|lateinit|override|tailrec|operator|suspend|infix|external|expect|actual|inline|value|const|vararg|crossinline|noinline|reified|out|in)\s+)*(?:const\s+)?(?:val|var)\b/;
const propertyAccessorLinePattern = /^\s*(?:get|set)\s*\(/;
const constructorDelegationLinePattern = /^\s*constructor\b[\s\S]*:\s*this\(/;
const syntheticConstructorInitNamePattern = /_init_\$(?:Init|Create)\$_/;
const partialControlLinePattern = /^\s*(?:if\b|else\b|when\b|catch\b|finally\b|try\b)/;
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
  const projectScopedIndex = normalizedInput.indexOf('core-render-web/');
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
  const projectScopedIndex = normalizedInput.indexOf('core-render-web/');
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
  return coverageScopeRoots.some((scopeRoot) => normalizedPath.startsWith(scopeRoot));
}

function getThresholds() {
  return coverageConfig.thresholds || coverageConfig.fallbackThresholds;
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
  return !!trimmed && /^[)\]};,]+(?:\s*\{)?$/u.test(trimmed);
}

function isConstructorDelegationLine(lineText) {
  return constructorDelegationLinePattern.test(lineText.trim());
}

function buildStructuralNeutralLineSet(filePath, sourceLines) {
  if (structuralNeutralLineCache.has(filePath)) {
    return structuralNeutralLineCache.get(filePath);
  }

  const neutralLines = new Set();
  let inBlockComment = false;
  let inClassHeader = false;

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
  });

  structuralNeutralLineCache.set(filePath, neutralLines);
  return neutralLines;
}

function isForceNeutralLine(filePath, sourceLines, lineNumber) {
  return buildStructuralNeutralLineSet(filePath, sourceLines).has(lineNumber);
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

function isCoveredContinuationLine(sourceLines, lineNumber) {
  const currentLine = getLineText(sourceLines, lineNumber).trim();
  const previousLine = getLineText(sourceLines, lineNumber - 1).trim();
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

  return /(?:\(|\|\||&&|\?:|\.\s*|\?\.\s*|,|[+\-*/%]=?|=)\s*$/u.test(previousLine)
    || /\bwhen\s*\{\s*$/u.test(previousLine);
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

  for (const [statementId, loc] of Object.entries(fileCoverage.statementMap || {})) {
    const count = Number(fileCoverage.s?.[statementId] || 0);
    const executableLines = getExecutableLines(loc, filePath, sourceLines);
    if (!executableLines.length) {
      continue;
    }

    if (count > 0) {
      setLineCoverage(lineCoverage, executableLines[0], count);
      executableLines.slice(1).forEach((lineNumber) => {
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
  alignFunctionHeaderCoverageWithBody(fileCoverage, lineCoverage, filePath, sourceLines);
  promoteCoveredTopLevelFunctionStatements(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteSimpleLambdaBodyCoverage(fileCoverage, lineCoverage, filePath, sourceLines, branchStats);
  promoteCoveredBuilderWrapperLines(lineCoverage, filePath, sourceLines);
  suppressFalseCoveredLinesInUncoveredBranches(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressTerminalCatchNullCoverageNoise(lineCoverage, filePath, sourceLines);
  suppressWhenTryCatchFallbackReturnNoise(fileCoverage, lineCoverage, filePath, sourceLines);
  suppressChainedTryFallbackReturnNoise(fileCoverage, lineCoverage, filePath, sourceLines);
  return lineCoverage;
}

function getReportRelativeSourcePath(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const projectScopedIndex = normalizedPath.indexOf('core-render-web/');
  return projectScopedIndex === -1
    ? normalizedPath
    : normalizedPath.slice(projectScopedIndex + 'core-render-web/'.length);
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

function promoteDirectCoveredBranchBodyLines(fileCoverage, lineCoverage, filePath, sourceLines) {
  for (const [branchId, branchCoverage] of Object.entries(fileCoverage.branchMap || {})) {
    const branchCounts = Array.isArray(fileCoverage.b?.[branchId]) ? fileCoverage.b[branchId] : [];
    const locations = Array.isArray(branchCoverage?.locations) ? branchCoverage.locations : [];
    locations.forEach((location, index) => {
      const executableLines = getExecutableLines(location, filePath, sourceLines);
      if (executableLines.length < 2 || executableLines.length > 4) {
        return;
      }

      const branchHeaderLine = location?.start?.line;
      const bodyLines = executableLines.filter((lineNumber) => lineNumber !== branchHeaderLine);
      if (!bodyLines.length) {
        return;
      }

      if (bodyLines.some((lineNumber) => isSimpleControlFlowLine(getLineText(sourceLines, lineNumber)))) {
        return;
      }

      const directCoveredCounts = bodyLines
        .map((lineNumber) => getDirectStatementCountOnLine(fileCoverage, lineNumber))
        .filter((count) => Number(count) > 0);
      const branchCount = Number(branchCounts[index] || 0);
      if (!directCoveredCounts.length && branchCount <= 0) {
        return;
      }

      const fallbackCount = Math.max(branchCount, ...directCoveredCounts);
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
      if (!executableLines.length || executableLines.length > 7) {
        return;
      }

      const branchHeaderLine = location?.start?.line;
      const branchHeaderText = getLineText(sourceLines, branchHeaderLine);
      const bodyLines = executableLines.filter((lineNumber) => lineNumber !== branchHeaderLine);
      if (!bodyLines.length && !isPartialControlLine(branchHeaderText)) {
        return;
      }
      const candidateLines = bodyLines.length ? bodyLines : executableLines;
      if (!candidateLines.length) {
        return;
      }

      const hasDirectCoveredBodyLine = candidateLines.some((lineNumber) => Number(getDirectStatementCountOnLine(fileCoverage, lineNumber)) > 0);
      if (hasDirectCoveredBodyLine) {
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

function getPromotedControlLineStatus(fileCoverage, filePath, sourceLines, lineNumber) {
  const lineText = getLineText(sourceLines, lineNumber).trim();
  if (!/^(?:if|else\s+if)\b/u.test(lineText)) {
    return null;
  }

  if (lineText.includes('{')) {
    const endLine = findBlockEndLine(sourceLines, lineNumber);
    if (endLine > lineNumber + 1 && hasCoveredExecutableLineInRange(fileCoverage, filePath, sourceLines, lineNumber + 1, endLine - 1)) {
      return 'yes';
    }

    const nextLine = nextExecutableLineAfter(filePath, sourceLines, endLine + 1);
    if (nextLine && Number(getLineCoverageCount(fileCoverage, nextLine)) > 0) {
      return 'partial';
    }
    return null;
  }

  if (/\breturn(?:@\w+)?\b/u.test(lineText) && hasCoveredExecutableBeforeBlockExit(fileCoverage, filePath, sourceLines, lineNumber + 1)) {
    return 'partial';
  }

  return null;
}

function deriveLineStatus(fileCoverage, filePath, sourceLines, lineNumber, branchStats) {
  if (isForceNeutralLine(filePath, sourceLines, lineNumber)) {
    return 'neutral';
  }

  const lineCount = getLineCoverageCount(fileCoverage, lineNumber);
  if (lineCount != null) {
    if (lineCount > 0) {
      return 'yes';
    }

    const promotedControlStatus = getPromotedControlLineStatus(fileCoverage, filePath, sourceLines, lineNumber);
    if (promotedControlStatus) {
      return promotedControlStatus;
    }

    return 'no';
  }

  const lineText = getLineText(sourceLines, lineNumber);
  const branchStat = branchStats.get(lineNumber);
  if (!branchStat || !isPartialControlLine(lineText)) {
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

function buildKotlinHtmlLineStatusMap(coverageData) {
  const lineStatusMap = new Map();

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
    lineStatusMap.set(getReportRelativeSourcePath(filePath), lineStatuses);
  }

  return lineStatusMap;
}

function shouldRemoveFunctionMapping(functionCoverage, count, sourceLines) {
  const name = functionCoverage?.name || '';
  const locLineText = getLineText(sourceLines, functionCoverage?.loc?.start?.line);
  const declLineText = getLineText(sourceLines, functionCoverage?.decl?.start?.line);

  if (syntheticAccessorNamePattern.test(name)) {
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

function shouldRemoveStatementMapping(lineText, startLine, syntheticAccessorLines) {
  if (isClassSignatureLine(lineText)) {
    return true;
  }

  if (isPrimaryConstructorPropertyLine(lineText)) {
    return !isRuntimeInitializedPrimaryConstructorPropertyLine(lineText);
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
      if (!shouldRemoveStatementMapping(lineText, startLine, syntheticAccessorLines)) {
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
      if (!shouldRemoveBranchMapping(lineText, lineNumber, branchCounts, syntheticAccessorLines)) {
        continue;
      }

      delete fileCoverage.branchMap[branchId];
      delete fileCoverage.b[branchId];
      stats.removedBranches += 1;
    }

    fileCoverage.l = computeLineCoverageFromStatements(fileCoverage, filePath, sourceLines);
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

function patchHtmlSpaIndexDefaults() {
  const htmlSpaIndexPath = join(reportDir, 'index.html');
  if (!existsSync(htmlSpaIndexPath)) {
    return;
  }

  const indexHtml = readFileSync(htmlSpaIndexPath, 'utf8');
  const patchedHtml = indexHtml.replace(
    /window\.metricsToShow = .*?;/,
    `window.metricsToShow = ${JSON.stringify(htmlSpaMetricsToShow)};\n                        if (!window.location.hash) {\n                            window.history.replaceState(null, '', ${JSON.stringify(htmlSpaDefaultHash)});\n                        }`,
  );

  if (patchedHtml !== indexHtml) {
    writeFileSync(htmlSpaIndexPath, patchedHtml);
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

function patchLineCoverageHtml(lineCoverageHtml, lineStatuses) {
  const coverageLines = lineCoverageHtml.replace(/\r\n/g, '\n').split('\n');
  if (coverageLines.length !== lineStatuses.length) {
    return lineCoverageHtml;
  }

  return coverageLines.map((lineHtml, index) => {
    const status = lineStatuses[index] || 'neutral';
    let patchedLineHtml = lineHtml.replace(/cline-(?:yes|no|neutral|partial)/gu, `cline-${status}`);
    if (status === 'neutral') {
      patchedLineHtml = patchedLineHtml.replace(/>[^<]*<\/span>/u, '>&nbsp;</span>');
    }
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

function patchKotlinDetailHtmlFiles(lineStatusMap) {
  if (!existsSync(reportDir)) {
    return 0;
  }

  let patchedCount = 0;
  const htmlFiles = walkReportHtmlFiles(reportDir);
  const detailBlockPattern = /<td class="line-coverage quiet">([\s\S]*?)<\/td><td class="text"><pre class="prettyprint(?:\s+lang-js)?">([\s\S]*?)<\/pre><\/td><\/tr>/u;

  for (const htmlPath of htmlFiles) {
    const html = readFileSync(htmlPath, 'utf8');
    const computedLineStatuses = lineStatusMap?.get(getHtmlReportRelativeSourcePath(htmlPath));
    const patchedHtml = html.replace(detailBlockPattern, (match, lineCoverageHtml, codeHtml) => {
      const lineStatuses = resolveLineStatuses(lineCoverageHtml, computedLineStatuses);
      const patchedLineCoverageHtml = patchLineCoverageHtml(lineCoverageHtml, lineStatuses);
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
  const lineStatusMap = buildKotlinHtmlLineStatusMap(patchedCoverageData);
  regenerateIstanbulReportsFromCoverageData(patchedCoverageData);
  writeFileSync(coverageFinalPath, JSON.stringify(patchedCoverageData));

  if (!checkOnly) {
    patchHtmlSpaIndexDefaults();
    patchCoverageCss();
    const patchedHtmlFiles = patchKotlinDetailHtmlFiles(lineStatusMap);
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
