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
import { join, dirname, normalize } from 'path';
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

  if (!html.includes('code-line code-line-') && !html.includes('coverage-code')) {
    return false;
  }

  const patchedHtml = html
    .replace(/<span class="code-line code-line-(?:yes|no|neutral)">/g, '')
    .replace(/<\/span>(\r?\n|<\/pre>)/g, '$1')
    .replace(/prettyprint lang-js coverage-code/g, 'prettyprint lang-js');

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
`;

  const baseCss = readFileSync(baseCssPath, 'utf8');
  const cleanedBaseCss = removeCoverageStyleMarker(baseCss, marker);
  if (cleanedBaseCss !== baseCss) {
    writeFileSync(baseCssPath, cleanedBaseCss);
    return;
  }
  if (!baseCss.includes(marker)) {
    writeFileSync(baseCssPath, `${baseCss}${cssPatch}`);
  }
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

