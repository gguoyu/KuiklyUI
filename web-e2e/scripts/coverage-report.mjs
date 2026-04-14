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
import webE2EConfig from '../config/index.cjs';

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
const { coverage: coverageConfig, reporting } = webE2EConfig;

const e2eRoot = join(__dirname, '..');
const projectRoot = join(e2eRoot, '..');
const NYC_BIN = join(
  e2eRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'nyc.cmd' : 'nyc'
);
const nycOutputDir = join(e2eRoot, reporting.nycTempDirName);
const mergedTempDir = join(e2eRoot, reporting.nycMergedDirName);
const mergedJson = join(mergedTempDir, 'out.json');
const reportDir = join(e2eRoot, reporting.coverageDir);
const nycrcPath = join(e2eRoot, '.nycrc.json');
const checkOnly = process.argv.includes('--check');
const coverageScopeRoots = coverageConfig.scopeRoots.map((scopeRoot) => normalize(join(projectRoot, scopeRoot)));
const generatedKotlinOutputRoot = normalize(join(projectRoot, coverageConfig.generatedKotlinOutputDir));
const sourceMapConsumerCache = new Map();
const sourceLineCache = new Map();
const declarationOnlyInterfaceDefaultParamLinesCache = new Map();

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

function classifyKotlinJsTailMismatch(expectedSource, actualSource) {
  if (!isKotlinSource(expectedSource)) {
    return null;
  }
  if (actualSource === null) {
    return 'null-tail';
  }
  if (
    actualSource !== expectedSource &&
    typeof actualSource === 'string' &&
    actualSource.startsWith('src/kotlin/')
  ) {
    return 'cross-source';
  }
  return null;
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

function normalizeCoverageColumn(column) {
  if (column === null || column === undefined || column === Infinity) {
    return Number.MAX_SAFE_INTEGER;
  }
  return column;
}

function findReusableStatementId(fileCoverage, loc, repairKind) {
  const exactId = findMatchingStatementId(fileCoverage, loc);
  if (exactId || repairKind !== 'null-tail') {
    return exactId;
  }

  let bestId = null;
  let bestScore = Infinity;
  for (const [statementId, statementLoc] of Object.entries(fileCoverage.statementMap ?? {})) {
    if (statementLoc.start.line !== loc.start.line) {
      continue;
    }

    const startDistance = Math.abs(statementLoc.start.column - loc.start.column);
    const endDistance = Math.abs(
      normalizeCoverageColumn(statementLoc.end.column) - normalizeCoverageColumn(loc.end.column)
    );
    const score = startDistance * 100000 + endDistance;
    if (score < bestScore) {
      bestId = statementId;
      bestScore = score;
    }
  }

  return bestId;
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

function markStatementLineCovered(lineStats, lineNumber, hits, incrementCount = false) {
  if (!lineStats[lineNumber]) {
    lineStats[lineNumber] = {
      count: 0,
      covered: false,
    };
  }
  if (incrementCount) {
    lineStats[lineNumber].count += 1;
  }
  if (hits > 0) {
    lineStats[lineNumber].covered = true;
  }
}

function readSourceLines(filePath) {
  const normalizedPath = normalize(filePath);
  if (!sourceLineCache.has(normalizedPath)) {
    sourceLineCache.set(normalizedPath, readFileSync(normalizedPath, 'utf8').split(/\r?\n/));
  }
  return sourceLineCache.get(normalizedPath);
}

function getSourceLine(filePath, lineNumber) {
  return readSourceLines(filePath)[lineNumber - 1] ?? '';
}

function isAssignmentLikeSourceLine(filePath, lineNumber) {
  const trimmedLine = getSourceLine(filePath, lineNumber).trim();
  if (!trimmedLine) {
    return false;
  }
  if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
    return false;
  }
  if (/^(package|import)\b/.test(trimmedLine)) {
    return false;
  }
  if (/^(private|public|internal|protected)?\s*(var|val)\s+[A-Za-z0-9_]+.*=/.test(trimmedLine)) {
    return true;
  }
  return /^[A-Za-z0-9_$.()[\]<>?]+\s*=/.test(trimmedLine);
}

function hasCoveredNeighbor(lineStats, lineNumber, maxDistance) {
  for (let distance = 1; distance <= maxDistance; distance += 1) {
    if (lineStats?.[lineNumber - distance]?.covered || lineStats?.[lineNumber + distance]?.covered) {
      return true;
    }
  }
  return false;
}

function shouldRepairSyntheticStatement(filePath, lineStats, lineNumber, repairKind) {
  if (repairKind === 'null-tail') {
    return true;
  }

  if (lineStats?.[lineNumber]) {
    return false;
  }

  const nextLine = lineStats?.[lineNumber + 1];
  if (nextLine?.covered) {
    return true;
  }

  if (!nextLine && lineStats?.[lineNumber + 2]?.covered) {
    return true;
  }

  return isAssignmentLikeSourceLine(filePath, lineNumber) && hasCoveredNeighbor(lineStats, lineNumber, 3);
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
  const repairKind = classifyKotlinJsTailMismatch(start.source, directTail.source);
  if (!repairKind) {
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
    repairKind,
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

      const fileLineStats = originalLineStats[synthetic.filePath];
      if (!shouldRepairSyntheticStatement(synthetic.filePath, fileLineStats, synthetic.loc.start.line, synthetic.repairKind)) {
        continue;
      }

      const existingId = findReusableStatementId(fileCoverage, synthetic.loc, synthetic.repairKind);
      if (existingId) {
        const previousHits = fileCoverage.s[existingId] ?? 0;
        if (previousHits < hits) {
          fileCoverage.s[existingId] = hits;
          markStatementLineCovered(fileLineStats, synthetic.loc.start.line, hits - previousHits);
          updated += 1;
          touchedFiles.add(synthetic.filePath);
        }
        continue;
      }

      const newId = String(Object.keys(fileCoverage.statementMap).length);
      fileCoverage.statementMap[newId] = synthetic.loc;
      fileCoverage.s[newId] = hits;
      markStatementLineCovered(fileLineStats, synthetic.loc.start.line, hits, true);
      added += 1;
      touchedFiles.add(synthetic.filePath);
    }
  }

  writeMergedCoverage(mergedCoverage);
  console.log(
    `Kotlin inline tail repair added ${added} statements and updated ${updated} statements across ${touchedFiles.size} files`
  );
}

function filterDeclarationOnlyInterfaceDefaultHelperCoverage() {
  const mergedCoverage = readMergedCoverage();
  let touchedFiles = 0;
  let removedStatements = 0;
  let removedBranches = 0;

  for (const [filePath, fileCoverage] of Object.entries(mergedCoverage)) {
    const filteredLines = getDeclarationOnlyInterfaceDefaultParameterLines(filePath);
    if (filteredLines.size === 0) {
      continue;
    }

    let fileTouched = false;
    for (const statementId of Object.keys(fileCoverage.statementMap ?? {})) {
      const statementLoc = fileCoverage.statementMap[statementId];
      if (!filteredLines.has(statementLoc.start.line)) {
        continue;
      }
      delete fileCoverage.statementMap[statementId];
      delete fileCoverage.s[statementId];
      removedStatements += 1;
      fileTouched = true;
    }

    for (const branchId of Object.keys(fileCoverage.branchMap ?? {})) {
      const branchMeta = fileCoverage.branchMap[branchId];
      const branchLine = branchMeta.line ?? branchMeta.loc?.start?.line;
      if (!filteredLines.has(branchLine)) {
        continue;
      }
      delete fileCoverage.branchMap[branchId];
      delete fileCoverage.b[branchId];
      removedBranches += 1;
      fileTouched = true;
    }

    if (fileTouched) {
      touchedFiles += 1;
    }
  }

  writeMergedCoverage(mergedCoverage);
  console.log(
    `Declaration-only interface default-helper filter removed ${removedStatements} statements and ${removedBranches} branches across ${touchedFiles} files`
  );
}

function shouldFilterStructuralCoverageLine(filePath, lineNumber) {
  if (!Number.isInteger(lineNumber) || lineNumber < 1) {
    return false;
  }

  const trimmedLine = getSourceLine(filePath, lineNumber).trim();
  return isStructuralDeclarationLine(trimmedLine);
}

function filterStructuralDeclarationCoverage() {
  const mergedCoverage = readMergedCoverage();
  let touchedFiles = 0;
  let removedStatements = 0;
  let removedFunctions = 0;
  let removedBranches = 0;

  for (const [filePath, fileCoverage] of Object.entries(mergedCoverage)) {
    let fileTouched = false;

    for (const statementId of Object.keys(fileCoverage.statementMap ?? {})) {
      const statementLoc = fileCoverage.statementMap[statementId];
      if (!shouldFilterStructuralCoverageLine(filePath, statementLoc.start.line)) {
        continue;
      }
      delete fileCoverage.statementMap[statementId];
      delete fileCoverage.s[statementId];
      removedStatements += 1;
      fileTouched = true;
    }

    for (const functionId of Object.keys(fileCoverage.fnMap ?? {})) {
      const functionMeta = fileCoverage.fnMap[functionId];
      const functionLine = functionMeta.line ?? functionMeta.decl?.start?.line ?? functionMeta.loc?.start?.line;
      if (!shouldFilterStructuralCoverageLine(filePath, functionLine)) {
        continue;
      }
      delete fileCoverage.fnMap[functionId];
      delete fileCoverage.f[functionId];
      removedFunctions += 1;
      fileTouched = true;
    }

    for (const branchId of Object.keys(fileCoverage.branchMap ?? {})) {
      const branchMeta = fileCoverage.branchMap[branchId];
      const branchLine = branchMeta.line ?? branchMeta.loc?.start?.line;
      if (!shouldFilterStructuralCoverageLine(filePath, branchLine)) {
        continue;
      }
      delete fileCoverage.branchMap[branchId];
      delete fileCoverage.b[branchId];
      removedBranches += 1;
      fileTouched = true;
    }

    if (fileTouched) {
      touchedFiles += 1;
    }
  }

  writeMergedCoverage(mergedCoverage);
  console.log(
    `Structural declaration filter removed ${removedStatements} statements, ${removedFunctions} functions, and ${removedBranches} branches across ${touchedFiles} files`
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

function isTypeDeclarationLine(trimmedLine) {
  return /^(?:(?:public|private|protected|internal|open|final|sealed|abstract|data|enum|annotation|inner|value|expect|actual|companion)\s+)*(?:class|object|interface)\b/.test(
    trimmedLine
  );
}

function isStructuralDeclarationLine(trimmedLine) {
  return isIgnorableCoverageLine(trimmedLine) || isTypeDeclarationLine(trimmedLine);
}

function isPropertyAccessorOnlyLine(trimmedLine) {
  return /^(?:public|private|protected|internal)\s+(?:get|set)\b$/.test(trimmedLine);
}

function isDeclarationOnlyMemberLine(trimmedLine) {
  if (!/^(?:(?:public|private|protected|internal|open|override|abstract|final|lateinit|const|expect|actual|sealed|data|inner|external|suspend|operator|infix|tailrec|vararg|reified)\s+)*(?:val|var)\b/.test(trimmedLine)) {
    return false;
  }
  if (trimmedLine.includes('=')) {
    return false;
  }
  if (/\bby\b/.test(trimmedLine)) {
    return false;
  }
  if (trimmedLine.endsWith('{')) {
    return false;
  }
  return true;
}

function isElseLikeStructuralLine(trimmedLine) {
  return /^(?:}\s*)?(?:else|try|finally|do)\b.*\{$/.test(trimmedLine);
}

function isInitBlockLine(trimmedLine) {
  return /^init\s*\{$/.test(trimmedLine);
}

function isLambdaHeaderContinuationLine(trimmedLine) {
  if (!trimmedLine.startsWith('{')) {
    return false;
  }
  const arrowIndex = trimmedLine.indexOf('->');
  if (arrowIndex === -1) {
    return false;
  }
  const afterArrow = trimmedLine.slice(arrowIndex + 2).trim();
  return afterArrow === '' || afterArrow === '{';
}

function isWhenBranchStructuralLine(trimmedLine) {
  const arrowIndex = trimmedLine.indexOf('->');
  if (arrowIndex === -1) {
    return false;
  }
  const beforeArrow = trimmedLine.slice(0, arrowIndex);
  if (beforeArrow.includes('{')) {
    return false;
  }
  const afterArrow = trimmedLine.slice(arrowIndex + 2).trim();
  return afterArrow === '' || afterArrow === '{';
}

function isFunctionDeclarationLine(trimmedLine) {
  return /^fun\b|^(?:public|private|protected|internal|open|override|suspend|inline|operator|infix|tailrec|expect|actual|final|sealed|data|const|lateinit|vararg|reified|abstract|external)\b.*\bfun\b/.test(
    trimmedLine
  );
}

function isDeclarationOnlyFunctionLine(trimmedLine) {
  if (!/\bfun\b/.test(trimmedLine)) {
    return false;
  }

  if (/\b(abstract|external)\b/.test(trimmedLine)) {
    return true;
  }

  if (trimmedLine.includes('{')) {
    return false;
  }

  const lastEqualsIndex = trimmedLine.lastIndexOf('=');
  if (lastEqualsIndex !== -1) {
    const closingParenIndex = trimmedLine.lastIndexOf(')');
    if (closingParenIndex === -1 || lastEqualsIndex > closingParenIndex) {
      return false;
    }
  }

  return isFunctionDeclarationLine(trimmedLine);
}

function isMultilineContinuationLine(trimmedLine, previousTrimmedLine) {
  if (!previousTrimmedLine) {
    return false;
  }

  if (/^(?:&&|\|\||\?:|\.\?|\.|,)/.test(trimmedLine)) {
    return true;
  }

  if (trimmedLine.startsWith('(') && /(?:\|\||&&|,|\()\s*$/.test(previousTrimmedLine)) {
    return true;
  }

  if (/(?:\|\||&&|,|\.|\.\?|\?:|=)\s*$/.test(previousTrimmedLine)) {
    return true;
  }

  return false;
}

function isStandaloneTypeAssertionLine(trimmedLine) {
  return /^[A-Za-z0-9_$.()[\]<>?]+\s+as\??\s+[A-Za-z0-9_$.<>?]+$/.test(trimmedLine);
}

function shouldAddBaselineStatement(trimmedLine, previousTrimmedLine) {
  if (isTypeDeclarationLine(trimmedLine)) {
    return false;
  }
  if (isPropertyAccessorOnlyLine(trimmedLine)) {
    return false;
  }
  if (isDeclarationOnlyMemberLine(trimmedLine)) {
    return false;
  }
  if (isElseLikeStructuralLine(trimmedLine)) {
    return false;
  }
  if (isInitBlockLine(trimmedLine)) {
    return false;
  }
  if (isLambdaHeaderContinuationLine(trimmedLine)) {
    return false;
  }
  if (isWhenBranchStructuralLine(trimmedLine)) {
    return false;
  }
  if (isMultilineContinuationLine(trimmedLine, previousTrimmedLine)) {
    return false;
  }
  if (isStandaloneTypeAssertionLine(trimmedLine)) {
    return false;
  }
  if (isFunctionDeclarationLine(trimmedLine) && trimmedLine.endsWith('{')) {
    return false;
  }
  if (/^(?:get|set)\s*\([^)]*\)\s*\{$/.test(trimmedLine)) {
    return false;
  }
  return true;
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

  let previousMeaningfulLine = '';
  let inFunctionSignature = false;
  sanitizedLines.forEach((lineText, index) => {
    const lineNumber = index + 1;
    const originalLine = originalLines[index] ?? lineText;
    const trimmedLine = lineText.trim();
    const previousTrimmedLine = previousMeaningfulLine;

    if (trimmedLine) {
      previousMeaningfulLine = trimmedLine;
    }

    const continuesFunctionSignature =
      inFunctionSignature ||
      (isDeclarationOnlyFunctionLine(trimmedLine) && !trimmedLine.includes(')') && !trimmedLine.includes('{') && !trimmedLine.includes('='));

    if (trimmedLine) {
      if (continuesFunctionSignature) {
        inFunctionSignature = !trimmedLine.includes(')') && !trimmedLine.includes('{') && !trimmedLine.includes('=');
      } else {
        inFunctionSignature = false;
      }
    }

    if (isIgnorableCoverageLine(trimmedLine)) {
      return;
    }

    if (isInterfaceDeclarationLine(trimmedLine)) {
      return;
    }

    if (continuesFunctionSignature) {
      return;
    }

    if (isDeclarationOnlyFunctionLine(trimmedLine)) {
      return;
    }

    const shouldAddStatement = shouldAddBaselineStatement(trimmedLine, previousTrimmedLine);
    if (shouldAddStatement) {
      addStatement(fileCoverage, lineNumber, originalLine);
    }

    if (/\bfun\b/.test(trimmedLine)) {
      addFunction(fileCoverage, lineNumber, originalLine);
    }

    if (/\bif\b/.test(trimmedLine) && shouldAddStatement) {
      addBranch(fileCoverage, lineNumber, originalLine, 2, 'if');
    }
    if (/\bwhen\b/.test(trimmedLine) && shouldAddStatement) {
      addBranch(fileCoverage, lineNumber, originalLine, 2, 'switch');
    }
    if (trimmedLine.includes('?:') && shouldAddStatement) {
      addBranch(fileCoverage, lineNumber, originalLine, 2, 'cond-expr');
    }

    const conditionalOps = shouldAddStatement ? countMatches(trimmedLine, /&&/g) + countMatches(trimmedLine, /\|\|/g) : 0;
    for (let branchIndex = 0; branchIndex < conditionalOps; branchIndex += 1) {
      addBranch(fileCoverage, lineNumber, originalLine, 2, 'binary-expr');
    }
  });

  return fileCoverage;
}

function hasCoverageEntries(fileCoverage) {
  return (
    Object.keys(fileCoverage.statementMap ?? {}).length > 0 ||
    Object.keys(fileCoverage.fnMap ?? {}).length > 0 ||
    Object.keys(fileCoverage.branchMap ?? {}).length > 0
  );
}

function getDeclarationOnlyInterfaceDefaultParameterLines(filePath) {
  const normalizedPath = normalize(filePath);
  if (declarationOnlyInterfaceDefaultParamLinesCache.has(normalizedPath)) {
    return declarationOnlyInterfaceDefaultParamLinesCache.get(normalizedPath);
  }

  const source = readFileSync(normalizedPath, 'utf8');
  if (!/\binterface\b/.test(source)) {
    const empty = new Set();
    declarationOnlyInterfaceDefaultParamLinesCache.set(normalizedPath, empty);
    return empty;
  }

  const baselineCoverage = buildZeroBaselineCoverage(normalizedPath);
  if (hasCoverageEntries(baselineCoverage)) {
    const empty = new Set();
    declarationOnlyInterfaceDefaultParamLinesCache.set(normalizedPath, empty);
    return empty;
  }

  const sanitizedLines = stripComments(source.split(/\r?\n/));
  const matchedLines = new Set();
  let inFunctionSignature = false;

  sanitizedLines.forEach((lineText, index) => {
    const trimmedLine = lineText.trim();
    const lineNumber = index + 1;

    if (!trimmedLine) {
      return;
    }

    const continuesFunctionSignature =
      inFunctionSignature ||
      (isDeclarationOnlyFunctionLine(trimmedLine) && !trimmedLine.includes('{') && !trimmedLine.includes('='));

    if (continuesFunctionSignature && trimmedLine.includes('=')) {
      matchedLines.add(lineNumber);
    }

    if (/\bfun\b/.test(trimmedLine) && trimmedLine.includes('=') && !trimmedLine.includes('{')) {
      matchedLines.add(lineNumber);
    }

    if (trimmedLine) {
      if (continuesFunctionSignature) {
        inFunctionSignature = !/^\)\s*,?$/.test(trimmedLine) && !trimmedLine.includes('{');
      } else {
        inFunctionSignature = false;
      }
    }
  });

  declarationOnlyInterfaceDefaultParamLinesCache.set(normalizedPath, matchedLines);
  return matchedLines;
}

function appendStatementCoverage(targetCoverage, loc, hits = 0) {
  const key = String(Object.keys(targetCoverage.statementMap).length);
  targetCoverage.statementMap[key] = loc;
  targetCoverage.s[key] = hits;
}

function appendFunctionCoverage(targetCoverage, fnMeta, hits = 0) {
  const key = String(Object.keys(targetCoverage.fnMap).length);
  targetCoverage.fnMap[key] = fnMeta;
  targetCoverage.f[key] = hits;
}

function appendBranchCoverage(targetCoverage, branchMeta, hits = []) {
  const key = String(Object.keys(targetCoverage.branchMap).length);
  targetCoverage.branchMap[key] = branchMeta;
  targetCoverage.b[key] = hits;
}

function getBranchLine(branchMeta) {
  return branchMeta.line ?? branchMeta.loc?.start?.line ?? null;
}

function mergeBaselineCoverage(targetCoverage, baselineCoverage) {
  const existingStatementLines = new Set(
    Object.values(targetCoverage.statementMap ?? {}).map((statementLoc) => statementLoc.start.line)
  );
  const existingFunctionLines = new Set(Object.values(targetCoverage.fnMap ?? {}).map((fnMeta) => fnMeta.line));
  const existingBranchLines = new Set(
    Object.values(targetCoverage.branchMap ?? {})
      .map((branchMeta) => getBranchLine(branchMeta))
      .filter((lineNumber) => lineNumber !== null)
  );

  let addedStatements = 0;
  let addedFunctions = 0;
  let addedBranches = 0;

  for (const statementLoc of Object.values(baselineCoverage.statementMap ?? {})) {
    const lineNumber = statementLoc.start.line;
    if (existingStatementLines.has(lineNumber)) {
      continue;
    }
    appendStatementCoverage(targetCoverage, statementLoc, 0);
    existingStatementLines.add(lineNumber);
    addedStatements += 1;
  }

  for (const fnMeta of Object.values(baselineCoverage.fnMap ?? {})) {
    if (existingFunctionLines.has(fnMeta.line)) {
      continue;
    }
    appendFunctionCoverage(targetCoverage, fnMeta, 0);
    existingFunctionLines.add(fnMeta.line);
    addedFunctions += 1;
  }

  for (const branchMeta of Object.values(baselineCoverage.branchMap ?? {})) {
    const branchLine = getBranchLine(branchMeta);
    if (branchLine !== null && existingBranchLines.has(branchLine)) {
      continue;
    }
    appendBranchCoverage(targetCoverage, branchMeta, Array(branchMeta.locations.length).fill(0));
    if (branchLine !== null) {
      existingBranchLines.add(branchLine);
    }
    addedBranches += 1;
  }

  return {
    addedStatements,
    addedFunctions,
    addedBranches,
  };
}

function supplementZeroBaselineCoverage() {
  const mergedCoverage = readMergedCoverage();
  const scopedFiles = collectScopedKotlinFiles();
  let missingFiles = 0;
  let supplementedFiles = 0;
  let skippedDeclarationOnlyFiles = 0;
  let addedStatements = 0;
  let addedFunctions = 0;
  let addedBranches = 0;

  for (const filePath of scopedFiles) {
    const baselineCoverage = buildZeroBaselineCoverage(filePath);
    const existingCoverage = mergedCoverage[filePath];
    const baselineHasEntries = hasCoverageEntries(baselineCoverage);

    if (!existingCoverage) {
      if (!baselineHasEntries) {
        skippedDeclarationOnlyFiles += 1;
        continue;
      }

      mergedCoverage[filePath] = baselineCoverage;
      missingFiles += 1;
      supplementedFiles += 1;
      addedStatements += Object.keys(baselineCoverage.statementMap).length;
      addedFunctions += Object.keys(baselineCoverage.fnMap).length;
      addedBranches += Object.keys(baselineCoverage.branchMap).length;
      continue;
    }

    if (!baselineHasEntries) {
      continue;
    }

    const mergeResult = mergeBaselineCoverage(existingCoverage, baselineCoverage);
    if (mergeResult.addedStatements || mergeResult.addedFunctions || mergeResult.addedBranches) {
      supplementedFiles += 1;
      addedStatements += mergeResult.addedStatements;
      addedFunctions += mergeResult.addedFunctions;
      addedBranches += mergeResult.addedBranches;
    }
  }

  writeMergedCoverage(mergedCoverage);
  console.log(
    `Coverage scope contains ${scopedFiles.length} Kotlin files; baseline supplemented ${supplementedFiles} files (${missingFiles} previously missing), skipped ${skippedDeclarationOnlyFiles} declaration-only files, adding ${addedStatements} statements, ${addedFunctions} functions, and ${addedBranches} branches`
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



function hasUncoveredBranchMarker(codeLine) {
  return /\b(?:missing-if-branch|cbranch-no)\b/.test(codeLine);
}

function stripHtmlTags(line) {
  return line.replace(/<[^>]+>/g, '');
}

function getLineIndent(line) {
  const match = line.match(/^\s*/);
  return match ? match[0].length : 0;
}

function isBlockHeaderLine(line) {
  return /^(?:}\s*)?(?:if|else\s+if|when)\b.*\{\s*$/.test(line.trim());
}

function hasCoveredNestedBlockLine(index, plainCodeLines, lineStatuses) {
  const currentIndent = getLineIndent(plainCodeLines[index]);

  for (let nextIndex = index + 1; nextIndex < plainCodeLines.length; nextIndex += 1) {
    const nextLine = plainCodeLines[nextIndex];
    const trimmedNextLine = nextLine.trim();
    if (!trimmedNextLine) {
      continue;
    }

    const nextIndent = getLineIndent(nextLine);
    if (nextIndent <= currentIndent) {
      break;
    }

    if (lineStatuses[nextIndex] === 'yes' || lineStatuses[nextIndex] === 'partial') {
      return true;
    }
  }

  return false;
}

function getEffectiveLineStatus(status, codeLine) {
  if (status === 'yes' && hasUncoveredBranchMarker(codeLine)) {
    return 'partial';
  }
  return status;
}

function fixFalseNegativeBlockHeaderStatus(lineStatuses, plainCodeLines) {
  return lineStatuses.map((status, index) => {
    if (status !== 'no') {
      return status;
    }

    if (!isBlockHeaderLine(plainCodeLines[index])) {
      return status;
    }

    return hasCoveredNestedBlockLine(index, plainCodeLines, lineStatuses) ? 'yes' : status;
  });
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
    const hasWrappedCodeLine = /^<span class="code-line code-line-(?:yes|no|neutral|partial)">/.test(line);
    if (!hasWrappedCodeLine) {
      return line;
    }
    return line
      .replace(/^<span class="code-line code-line-(?:yes|no|neutral|partial)">/, '')
      .replace(/<\/span>$/, '');
  });

  if (codeLines.length !== lineStatuses.length) {
    return false;
  }

  const plainCodeLines = codeLines.map((line) => stripHtmlTags(line));
  const provisionalLineStatuses = lineStatuses.map((status, index) =>
    getEffectiveLineStatus(status, codeLines[index])
  );
  const effectiveLineStatuses = fixFalseNegativeBlockHeaderStatus(provisionalLineStatuses, plainCodeLines);

  const wrappedCode = codeLines
    .map((line, index) => `<span class="code-line code-line-${effectiveLineStatuses[index]}">${line}</span>`)
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

.coverage-code .code-line-partial {
  background: rgba(249, 205, 11, 0.28);
  border-left-color: #f9cd0b;
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
filterDeclarationOnlyInterfaceDefaultHelperCoverage();
filterStructuralDeclarationCoverage();
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

