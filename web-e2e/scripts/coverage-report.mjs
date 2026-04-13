#!/usr/bin/env node
/**
 * NYC Kotlin coverage report helper.
 *
 * It merges raw browser coverage, filters the Kotlin source scope,
 * supplements zero-hit baselines for missing files, and then asks NYC
 * to generate the final report/check thresholds.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { join, dirname, normalize, resolve } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

function execSyncWithLocalNyc(command, options = {}) {
  let rewrittenCommand = command;
  if (command.startsWith('npx nyc ')) {
    rewrittenCommand = `${NYC_BIN} ${command.slice('npx nyc '.length)}`;
  }
  return execSync(rewrittenCommand, options);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const { SourceMapConsumer } = require('source-map');

const e2eRoot = join(__dirname, '..');
const projectRoot = join(e2eRoot, '..');
const NYC_BIN = join(
  e2eRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'nyc.cmd' : 'nyc'
);
const nycOutputDir = join(e2eRoot, '.nyc_output');
const mergedTempDir = join(e2eRoot, '.nyc_merged');
const mergedJson = join(mergedTempDir, 'out.json');
const reportDir = join(e2eRoot, 'reports', 'coverage');
const nycrcPath = join(e2eRoot, '.nycrc.json');
const checkOnly = process.argv.includes('--check');
const coverageScopeRoots = [
  normalize(join(projectRoot, 'core-render-web', 'base', 'src', 'jsMain', 'kotlin')),
  normalize(join(projectRoot, 'core-render-web', 'h5', 'src', 'jsMain', 'kotlin')),
];
const generatedKotlinOutputRoot = normalize(
  join(projectRoot, 'h5App', 'build', 'compileSync', 'js', 'main', 'developmentExecutable', 'kotlin')
);
const sourceMapConsumerCache = new Map();

if (!existsSync(nycOutputDir)) {
  console.error('.nyc_output does not exist, run instrumented coverage tests first');
  console.error('Recommended: node scripts/kuikly-test.mjs --full');
  process.exit(1);
}

function prepareMergedCoverage() {
  if (existsSync(mergedTempDir)) {
    rmSync(mergedTempDir, { recursive: true, force: true });
  }
  mkdirSync(mergedTempDir, { recursive: true });

  console.log('Merging raw coverage data...');
  execSync(`npx nyc merge "${nycOutputDir}" "${mergedJson}"`, {
    cwd: e2eRoot,
    stdio: 'inherit',
  });

  filterMergedCoverage();
  supplementZeroBaselineCoverage();
}

function isInCoverageScope(filePath) {
  const normalizedPath = normalize(filePath);
  return coverageScopeRoots.some((root) => normalizedPath.startsWith(root));
}

function readMergedCoverage() {
  return JSON.parse(readFileSync(mergedJson, 'utf8'));
}

function writeMergedCoverage(coverage) {
  const sortedCoverage = Object.fromEntries(
    Object.entries(coverage).sort(([left], [right]) => left.localeCompare(right))
  );
  writeFileSync(mergedJson, `${JSON.stringify(sortedCoverage, null, 2)}\n`);
}

function isGeneratedKotlinModule(filePath) {
  const normalizedPath = normalize(filePath);
  return normalizedPath.startsWith(generatedKotlinOutputRoot) && normalizedPath.endsWith('.js');
}

function mergeRawGeneratedJsCoverage() {
  const merged = {};

  for (const entry of readdirSync(nycOutputDir)) {
    if (!entry.endsWith('.json')) {
      continue;
    }

    const fullPath = join(nycOutputDir, entry);
    const coverage = JSON.parse(readFileSync(fullPath, 'utf8'));

    for (const [filePath, fileCoverage] of Object.entries(coverage)) {
      if (!isGeneratedKotlinModule(filePath)) {
        continue;
      }

      const normalizedPath = normalize(filePath);
      if (!merged[normalizedPath]) {
        merged[normalizedPath] = {
          statementMap: fileCoverage.statementMap ?? {},
          s: { ...(fileCoverage.s ?? {}) },
        };
        continue;
      }

      for (const [statementId, hits] of Object.entries(fileCoverage.s ?? {})) {
        merged[normalizedPath].s[statementId] = (merged[normalizedPath].s[statementId] ?? 0) + hits;
      }
    }
  }

  return merged;
}

function originalPositionTryBoth(sourceMap, line, column) {
  const mapping = sourceMap.originalPositionFor({
    line,
    column,
    bias: SourceMapConsumer.GREATEST_LOWER_BOUND,
  });
  if (mapping.source === null) {
    return sourceMap.originalPositionFor({
      line,
      column,
      bias: SourceMapConsumer.LEAST_UPPER_BOUND,
    });
  }
  return mapping;
}

function isKotlinSource(source) {
  return typeof source === 'string' && source.endsWith('.kt');
}

function isKotlinJsTailMismatch(expectedSource, actualSource) {
  return (
    isKotlinSource(expectedSource) &&
    (actualSource === null ||
      (actualSource !== expectedSource &&
        typeof actualSource === 'string' &&
        actualSource.startsWith('src/kotlin/')))
  );
}

function originalEndPositionForMapping(sourceMap, beforeEndMapping) {
  const afterEndMapping = sourceMap.generatedPositionFor({
    source: beforeEndMapping.source,
    line: beforeEndMapping.line,
    column: beforeEndMapping.column + 1,
    bias: SourceMapConsumer.LEAST_UPPER_BOUND,
  });

  if (
    afterEndMapping.line === null ||
    sourceMap.originalPositionFor(afterEndMapping).line !== beforeEndMapping.line
  ) {
    return {
      source: beforeEndMapping.source,
      line: beforeEndMapping.line,
      column: Infinity,
    };
  }

  return sourceMap.originalPositionFor(afterEndMapping);
}

function sameCoverageColumn(left, right) {
  const normalizeColumn = (value) => (value === Infinity ? null : value);
  return normalizeColumn(left) === normalizeColumn(right);
}

function findMatchingStatementId(fileCoverage, loc) {
  for (const [statementId, statementLoc] of Object.entries(fileCoverage.statementMap ?? {})) {
    if (
      statementLoc.start.line === loc.start.line &&
      statementLoc.start.column === loc.start.column &&
      statementLoc.end.line === loc.end.line &&
      sameCoverageColumn(statementLoc.end.column, loc.end.column)
    ) {
      return statementId;
    }
  }
  return null;
}

function buildStatementLineStats(fileCoverage) {
  const stats = {};

  for (const [statementId, statementLoc] of Object.entries(fileCoverage.statementMap ?? {})) {
    const lineNumber = statementLoc.start.line;
    if (!stats[lineNumber]) {
      stats[lineNumber] = {
        count: 0,
        covered: false,
      };
    }
    stats[lineNumber].count += 1;
    if ((fileCoverage.s?.[statementId] ?? 0) > 0) {
      stats[lineNumber].covered = true;
    }
  }

  return stats;
}

function shouldRepairSyntheticStatement(lineStats, lineNumber) {
  if (lineStats?.[lineNumber]) {
    return false;
  }

  const nextLine = lineStats?.[lineNumber + 1];
  if (nextLine?.covered) {
    return true;
  }

  return !nextLine && Boolean(lineStats?.[lineNumber + 2]?.covered);
}

async function getSourceMapConsumerFor(jsFilePath) {
  const normalizedPath = normalize(jsFilePath);
  if (sourceMapConsumerCache.has(normalizedPath)) {
    return sourceMapConsumerCache.get(normalizedPath);
  }

  const mapPath = `${normalizedPath}.map`;
  if (!existsSync(mapPath)) {
    sourceMapConsumerCache.set(normalizedPath, null);
    return null;
  }

  const rawSourceMap = JSON.parse(readFileSync(mapPath, 'utf8'));
  const consumer = await new SourceMapConsumer(rawSourceMap);
  sourceMapConsumerCache.set(normalizedPath, consumer);
  return consumer;
}

function resolveOriginalSourcePath(jsFilePath, source) {
  return normalize(resolve(dirname(jsFilePath), source));
}

function mapJsStatementToSyntheticKotlinStatement(sourceMap, jsFilePath, statementLoc) {
  if (!statementLoc?.start || !statementLoc?.end || statementLoc.end.column <= 0) {
    return null;
  }

  const start = originalPositionTryBoth(sourceMap, statementLoc.start.line, statementLoc.start.column);
  if (!start?.source || !isKotlinSource(start.source) || start.line === null || start.column === null) {
    return null;
  }

  const directTail = originalPositionTryBoth(sourceMap, statementLoc.end.line, statementLoc.end.column - 1);
  if (!isKotlinJsTailMismatch(start.source, directTail.source)) {
    return null;
  }

  let repairedTail = null;
  for (let column = statementLoc.end.column - 2; column >= statementLoc.start.column; column -= 1) {
    const candidate = originalPositionTryBoth(sourceMap, statementLoc.end.line, column);
    if (candidate.source === start.source) {
      repairedTail = candidate;
      break;
    }
  }

  if (!repairedTail) {
    return null;
  }

  const end = originalEndPositionForMapping(sourceMap, repairedTail);
  if (!end?.source || end.source !== start.source || end.line === null) {
    return null;
  }

  const kotlinPath = resolveOriginalSourcePath(jsFilePath, start.source);
  if (!isInCoverageScope(kotlinPath)) {
    return null;
  }

  return {
    filePath: kotlinPath,
    loc: {
      start: {
        line: start.line,
        column: start.column,
      },
      end: {
        line: end.line,
        column: end.column,
      },
    },
  };
}

async function repairKotlinInlineTailMappings() {
  const mergedCoverage = readMergedCoverage();
  const originalLineStats = Object.fromEntries(
    Object.entries(mergedCoverage).map(([filePath, fileCoverage]) => [filePath, buildStatementLineStats(fileCoverage)])
  );
  const rawGeneratedCoverage = mergeRawGeneratedJsCoverage();
  let added = 0;
  let updated = 0;
  const touchedFiles = new Set();

  for (const [jsFilePath, jsCoverage] of Object.entries(rawGeneratedCoverage)) {
    const sourceMap = await getSourceMapConsumerFor(jsFilePath);
    if (!sourceMap) {
      continue;
    }

    for (const [statementId, statementLoc] of Object.entries(jsCoverage.statementMap ?? {})) {
      const hits = jsCoverage.s?.[statementId] ?? 0;
      if (!hits) {
        continue;
      }

      const synthetic = mapJsStatementToSyntheticKotlinStatement(sourceMap, jsFilePath, statementLoc);
      if (!synthetic) {
        continue;
      }

      const fileCoverage = mergedCoverage[synthetic.filePath];
      if (!fileCoverage) {
        continue;
      }

      if (!shouldRepairSyntheticStatement(originalLineStats[synthetic.filePath], synthetic.loc.start.line)) {
        continue;
      }

      const existingId = findMatchingStatementId(fileCoverage, synthetic.loc);
      if (existingId) {
        const previousHits = fileCoverage.s[existingId] ?? 0;
        if (previousHits < hits) {
          fileCoverage.s[existingId] = hits;
          updated += 1;
          touchedFiles.add(synthetic.filePath);
        }
        continue;
      }

      const newId = String(Object.keys(fileCoverage.statementMap).length);
      fileCoverage.statementMap[newId] = synthetic.loc;
      fileCoverage.s[newId] = hits;
      added += 1;
      touchedFiles.add(synthetic.filePath);
    }
  }

  writeMergedCoverage(mergedCoverage);
  console.log(
    `Kotlin inline tail repair added ${added} statements and updated ${updated} statements across ${touchedFiles.size} files`
  );
}

function filterMergedCoverage() {
  const mergedCoverage = readMergedCoverage();
  const filteredCoverage = Object.fromEntries(
    Object.entries(mergedCoverage).filter(([filePath]) => isInCoverageScope(filePath))
  );

  writeMergedCoverage(filteredCoverage);
  console.log(
    `Coverage filtered to ${Object.keys(filteredCoverage).length} Kotlin files under core-render-web/base and core-render-web/h5`
  );
}

function walkKotlinFiles(dir, result = []) {
  if (!existsSync(dir)) {
    return result;
  }

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkKotlinFiles(fullPath, result);
      continue;
    }
    if (entry.endsWith('.kt')) {
      result.push(normalize(fullPath));
    }
  }
  return result;
}

function collectScopedKotlinFiles() {
  return [...new Set(coverageScopeRoots.flatMap((root) => walkKotlinFiles(root)))];
}

function stripComments(lines) {
  const sanitized = [];
  let inBlockComment = false;

  for (const rawLine of lines) {
    let output = '';
    let index = 0;

    while (index < rawLine.length) {
      if (inBlockComment) {
        const endBlock = rawLine.indexOf('*/', index);
        if (endBlock === -1) {
          index = rawLine.length;
          break;
        }
        inBlockComment = false;
        index = endBlock + 2;
        continue;
      }

      const startBlock = rawLine.indexOf('/*', index);
      const startLine = rawLine.indexOf('//', index);
      const candidates = [startBlock, startLine].filter((value) => value !== -1);
      const nextComment = candidates.length > 0 ? Math.min(...candidates) : -1;

      if (nextComment === -1) {
        output += rawLine.slice(index);
        break;
      }

      output += rawLine.slice(index, nextComment);

      if (nextComment === startLine) {
        break;
      }

      inBlockComment = true;
      index = nextComment + 2;
    }

    sanitized.push(output);
  }

  return sanitized;
}

function isIgnorableCoverageLine(trimmedLine) {
  if (!trimmedLine) {
    return true;
  }
  if (trimmedLine.startsWith('package ') || trimmedLine.startsWith('import ')) {
    return true;
  }
  if (trimmedLine.startsWith('@')) {
    return true;
  }
  if (/^[{}()[\],.;]+$/.test(trimmedLine)) {
    return true;
  }
  return false;
}

function isInterfaceDeclarationLine(trimmedLine) {
  return /^interface\s+[A-Za-z0-9_]+/.test(trimmedLine);
}

function isDeclarationOnlyFunctionLine(trimmedLine) {
  if (!/\bfun\b/.test(trimmedLine)) {
    return false;
  }

  if (/\b(abstract|external)\b/.test(trimmedLine)) {
    return true;
  }

  const hasBody = trimmedLine.includes('{') || trimmedLine.includes('=');
  if (hasBody) {
    return false;
  }

  return /^fun\b|^(?:public|private|protected|internal|open|override|suspend|inline|operator|infix|tailrec|expect|actual|final|sealed|data|const|lateinit|vararg|reified|abstract|external)\b/.test(trimmedLine);
}

function createPosition(lineNumber, column) {
  return { line: lineNumber, column };
}

function createRange(lineNumber, startColumn, endColumn) {
  return {
    start: createPosition(lineNumber, startColumn),
    end: createPosition(lineNumber, endColumn),
  };
}

function addStatement(fileCoverage, lineNumber, lineText) {
  const key = String(Object.keys(fileCoverage.statementMap).length);
  const firstColumn = Math.max(0, lineText.search(/\S/));
  const lastColumn = Math.max(firstColumn, lineText.length - 1);

  fileCoverage.statementMap[key] = createRange(lineNumber, firstColumn, lastColumn);
  fileCoverage.s[key] = 0;
}

function addFunction(fileCoverage, lineNumber, lineText) {
  const key = String(Object.keys(fileCoverage.fnMap).length);
  const match = lineText.match(/\bfun\s+([A-Za-z0-9_]+)/);
  const name = match?.[1] ?? `(anonymous_${key})`;
  const firstColumn = Math.max(0, lineText.search(/\S/));
  const lastColumn = Math.max(firstColumn, lineText.length - 1);

  fileCoverage.fnMap[key] = {
    name,
    decl: createRange(lineNumber, firstColumn, lastColumn),
    loc: createRange(lineNumber, firstColumn, lastColumn),
    line: lineNumber,
  };
  fileCoverage.f[key] = 0;
}

function addBranch(fileCoverage, lineNumber, lineText, branchCount, type = 'cond-expr') {
  const key = String(Object.keys(fileCoverage.branchMap).length);
  const firstColumn = Math.max(0, lineText.search(/\S/));
  const lastColumn = Math.max(firstColumn, lineText.length - 1);
  const loc = createRange(lineNumber, firstColumn, lastColumn);

  fileCoverage.branchMap[key] = {
    loc,
    type,
    locations: Array.from({ length: branchCount }, () => ({
      start: { ...loc.start },
      end: { ...loc.end },
    })),
    line: lineNumber,
  };
  fileCoverage.b[key] = Array(branchCount).fill(0);
}

function countMatches(lineText, regex) {
  return [...lineText.matchAll(regex)].length;
}

function buildZeroBaselineCoverage(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const originalLines = source.split(/\r?\n/);
  const sanitizedLines = stripComments(originalLines);
  const fileCoverage = {
    path: filePath,
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
  };

  sanitizedLines.forEach((lineText, index) => {
    const lineNumber = index + 1;
    const originalLine = originalLines[index] ?? lineText;
    const trimmedLine = lineText.trim();

    if (isIgnorableCoverageLine(trimmedLine)) {
      return;
    }

    if (isInterfaceDeclarationLine(trimmedLine)) {
      return;
    }

    if (isDeclarationOnlyFunctionLine(trimmedLine)) {
      return;
    }

    addStatement(fileCoverage, lineNumber, originalLine);

    if (/\bfun\b/.test(trimmedLine)) {
      addFunction(fileCoverage, lineNumber, originalLine);
    }

    if (/\bif\b/.test(trimmedLine)) {
      addBranch(fileCoverage, lineNumber, originalLine, 2, 'if');
    }
    if (/\bwhen\b/.test(trimmedLine)) {
      addBranch(fileCoverage, lineNumber, originalLine, 2, 'switch');
    }
    if (trimmedLine.includes('?:')) {
      addBranch(fileCoverage, lineNumber, originalLine, 2, 'cond-expr');
    }

    const conditionalOps = countMatches(trimmedLine, /&&/g) + countMatches(trimmedLine, /\|\|/g);
    for (let branchIndex = 0; branchIndex < conditionalOps; branchIndex += 1) {
      addBranch(fileCoverage, lineNumber, originalLine, 2, 'binary-expr');
    }
  });

  if (Object.keys(fileCoverage.statementMap).length === 0) {
    fileCoverage.statementMap['0'] = createRange(1, 0, 0);
    fileCoverage.s['0'] = 0;
  }

  return fileCoverage;
}

function supplementZeroBaselineCoverage() {
  const mergedCoverage = readMergedCoverage();
  const scopedFiles = collectScopedKotlinFiles();
  const coveredFiles = new Set(Object.keys(mergedCoverage).map((filePath) => normalize(filePath)));
  const missingFiles = scopedFiles.filter((filePath) => !coveredFiles.has(filePath));

  for (const filePath of missingFiles) {
    mergedCoverage[filePath] = buildZeroBaselineCoverage(filePath);
  }

  writeMergedCoverage(mergedCoverage);
  console.log(
    `Coverage scope contains ${scopedFiles.length} Kotlin files; supplemented ${missingFiles.length} missing files with zero-hit baselines`
  );
}

function buildBaseFlags() {
  return [
    `--cwd "${projectRoot}"`,
    `--temp-dir "${mergedTempDir}"`,
    `--nycrc-path "${nycrcPath}"`,
    '--exclude-after-remap=false',
  ].join(' ');
}

function walkHtmlFiles(dir) {
  const result = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      result.push(...walkHtmlFiles(fullPath));
      continue;
    }
    if (entry.endsWith('.html')) {
      result.push(fullPath);
    }
  }
  return result;
}



function patchCoverageHtmlFile(filePath) {
  const html = readFileSync(filePath, 'utf8');
  if (!html.includes('<table class="coverage">')) {
    return false;
  }

  const coverageCellStart = '<td class="line-coverage quiet">';
  const textCellStart = '</td><td class="text"><pre class="';
  const preClose = '</pre></td></tr></table></pre>';

  const coverageStartIndex = html.indexOf(coverageCellStart);
  const textStartIndex = html.indexOf(textCellStart, coverageStartIndex);
  const preCloseIndex = html.indexOf(preClose, textStartIndex);
  if (coverageStartIndex === -1 || textStartIndex === -1 || preCloseIndex === -1) {
    return false;
  }

  const coverageSegment = html.slice(coverageStartIndex + coverageCellStart.length, textStartIndex);
  const preClassStartIndex = textStartIndex + textCellStart.length;
  const preClassEndIndex = html.indexOf('">', preClassStartIndex);
  if (preClassEndIndex === -1) {
    return false;
  }

  const preClass = html.slice(preClassStartIndex, preClassEndIndex);
  const codeStartIndex = preClassEndIndex + 2;
  const codeSegment = html.slice(codeStartIndex, preCloseIndex);

  const lineStatuses = [...coverageSegment.matchAll(/cline-any\s+cline-(yes|no|neutral)/g)].map((match) => match[1]);
  if (lineStatuses.length === 0) {
    return false;
  }

  const rawCodeLines = codeSegment.split(/\r?\n/);
  const codeLines = rawCodeLines.map((line) => {
    const hasWrappedCodeLine = /^<span class="code-line code-line-(?:yes|no|neutral)">/.test(line);
    if (!hasWrappedCodeLine) {
      return line;
    }
    return line
      .replace(/^<span class="code-line code-line-(?:yes|no|neutral)">/, '')
      .replace(/<\/span>$/, '');
  });

  if (codeLines.length !== lineStatuses.length) {
    return false;
  }

  const wrappedCode = codeLines
    .map((line, index) => `<span class="code-line code-line-${lineStatuses[index]}">${line}</span>`)
    .join('\n');

  const normalizedPreClass = [...new Set([
    ...preClass.split(/\s+/).filter(Boolean).filter((className) => className !== 'prettyprint' && className !== 'lang-js'),
    'coverage-code',
  ])].join(' ');
  const patchedHtml = `${html.slice(0, preClassStartIndex)}${normalizedPreClass}">${wrappedCode}${html.slice(preCloseIndex)}`;

  writeFileSync(filePath, patchedHtml);
  return true;
}

function removeCoverageStyleMarker(content, marker) {
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    return content;
  }

  const nextMarkerIndex = content.indexOf('/* ', markerIndex + marker.length);
  const endIndex = nextMarkerIndex === -1 ? content.length : nextMarkerIndex;
  return `${content.slice(0, markerIndex).trimEnd()}\n${content.slice(endIndex).trimStart()}`;
}

function patchCoverageStyles() {
  const baseCssPath = join(reportDir, 'base.css');
  const marker = '/* kuikly coverage code line highlighting */';
  const cssPatch = `

${marker}
.coverage td.text {
  width: 100%;
}

.coverage-code {
  white-space: normal;
}

.coverage-code .code-line {
  display: block;
  white-space: pre;
  margin: 0 -6px;
  padding: 0 6px;
  border-left: 4px solid transparent;
}

.coverage-code .code-line-yes {
  background: rgba(77, 146, 33, 0.44);
  border-left-color: rgb(35, 102, 10);
}

.coverage-code .code-line-no {
  background: rgba(194, 31, 57, 0.38);
  border-left-color: #8F1128;
}

.coverage-code .code-line-neutral {
  background: transparent;
}

.coverage-code .cstat-yes,
.coverage-code .cstat-no,
.coverage-code .fstat-yes,
.coverage-code .fstat-no,
.coverage-code .cbranch-no,
.coverage-code .cbranch-skip,
.coverage-code .cstat-skip,
.coverage-code .fstat-skip {
  background: transparent !important;
  color: inherit !important;
}

.coverage-code .cbranch-no {
  border-bottom: 2px solid #f9cd0b;
}
`;

  const baseCss = readFileSync(baseCssPath, 'utf8');
  const cleanedBaseCss = removeCoverageStyleMarker(baseCss, marker);
  writeFileSync(baseCssPath, `${cleanedBaseCss.trimEnd()}${cssPatch}\n`);
}

function postProcessCoverageReport() {
  if (!existsSync(reportDir)) {
    return;
  }

  patchCoverageStyles();

  const htmlFiles = walkHtmlFiles(reportDir);
  let patchedCount = 0;
  for (const filePath of htmlFiles) {
    if (patchCoverageHtmlFile(filePath)) {
      patchedCount += 1;
    }
  }
  console.log(`Coverage report style enhancement complete, processed ${patchedCount} file pages`);
}

prepareMergedCoverage();
await repairKotlinInlineTailMappings();
const baseFlags = buildBaseFlags();

if (checkOnly) {
  console.log('Checking Kotlin coverage thresholds with NYC...');
  execSync(`npx nyc check-coverage ${baseFlags}`, { cwd: e2eRoot, stdio: 'inherit' });
  console.log('Coverage thresholds passed');
} else {
  console.log('Generating Kotlin coverage report with NYC...');
  execSync(`npx nyc report ${baseFlags} --report-dir "${reportDir}" --no-check-coverage`, {
    cwd: e2eRoot,
    stdio: 'inherit',
  });
  postProcessCoverageReport();
  console.log(`Coverage report generated: ${reportDir}/index.html`);
}

