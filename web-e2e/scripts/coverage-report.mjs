#!/usr/bin/env node
/**
 * Generate Kotlin coverage reports from Playwright V8 coverage.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join, normalize, resolve } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import webE2EConfig from '../config/index.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const MCR = require('monocart-coverage-reports');

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
const checkOnly = process.argv.includes('--check');
const htmlSpaMetricsToShow = ['statements', 'lines', 'branches', 'functions'];
const htmlSpaDefaultHash = '#file/desc/true/true/true/true//';

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

function patchHtmlSpaIndexDefaults() {
  const htmlSpaIndexPath = join(reportDir, 'index.html');
  if (!existsSync(htmlSpaIndexPath)) {
    return;
  }

  const indexHtml = readFileSync(htmlSpaIndexPath, 'utf8');
  const patchedHtml = indexHtml.replace(
    /window\.metricsToShow = .*?;/,
    `window.metricsToShow = ${JSON.stringify(htmlSpaMetricsToShow)};
                        if (!window.location.hash) {
                            window.history.replaceState(null, '', ${JSON.stringify(htmlSpaDefaultHash)});
                        }`
  );

  if (patchedHtml !== indexHtml) {
    writeFileSync(htmlSpaIndexPath, patchedHtml);
  }
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
    reports: checkOnly
      ? [
          ['text-summary'],
          ['json-summary'],
        ]
      :         [
          ['text-summary'],
          ['html-spa', { metricsToShow: htmlSpaMetricsToShow }],
          ['lcovonly'],
          ['json'],
          ['json-summary'],
        ],
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

  if (checkOnly) {
    assertCoverageThresholds(readIstanbulSummaryTotal());
    console.log('Coverage thresholds passed');
    return;
  }

  patchHtmlSpaIndexDefaults();
  console.log(`Coverage report generated: ${coverageResults.reportPath}`);
}

await main();
