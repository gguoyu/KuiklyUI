#!/usr/bin/env node
/**
 * Generate a JS-level HTML coverage report from Playwright V8 coverage without sourcemap remapping.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join, normalize } from 'path';
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
const reportDir = join(e2eRoot, 'reports', 'coverage-js-no-sourcemap-html');
const generatedKotlinOutputDir = normalize(join(projectRoot, coverageConfig.generatedKotlinOutputDir));
const targetModuleSet = new Set(coverageConfig.targetModules);
const distFileCache = new Map();

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

function stripSourceMapComments(source = '') {
  return `${source
    .replace(/\/\/[@#]\s*sourceMappingURL=[^\r\n]*/g, '')
    .replace(/\/\*[@#]\s*sourceMappingURL=[\s\S]*?\*\//g, '')
    .trimEnd()}\n`;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
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

function prepareEntriesForJsReport(entries) {
  return entries.map((entry) => {
    const distFile = resolveDistFileFromUrl(entry.url);
    return {
      ...entry,
      distFile: distFile || entry.distFile,
      source: stripSourceMapComments(entry.source),
      sourceMap: undefined,
    };
  });
}

function resolveSourcePath(filePath, info = {}) {
  if (info.distFile) {
    return normalize(info.distFile);
  }
  if (/^[a-zA-Z]:[\\/]/.test(filePath) || filePath.startsWith('/')) {
    return normalize(filePath);
  }
  return normalize(join(generatedKotlinOutputDir, filePath));
}

async function main() {
  const rawEntries = readRawCoverageEntries();
  const coverageEntries = prepareEntriesForJsReport(rawEntries);

  if (!coverageEntries.length) {
    throw new Error('No V8 coverage entries matched the generated Kotlin JS modules');
  }

  const mcr = MCR({
    name: 'Kuikly Web JS Coverage (No Sourcemap)',
    outputDir: reportDir,
    baseDir: projectRoot,
    clean: true,
    logging: 'off',
    reports: [
      ['text-summary'],
      ['html'],
      ['json'],
    ],
    entryFilter: (entry) => isTargetModuleName(getEntryFileName(entry.url)),
    sourcePath: resolveSourcePath,
    all: {
      dir: generatedKotlinOutputDir,
      filter: (filePath) => isTargetModuleName(filePath.split(/[\\/]/).pop() || ''),
    },
  });

  await mcr.add(coverageEntries);
  const coverageResults = await mcr.generate();
  console.log(`JS coverage report generated: ${coverageResults.reportPath}`);
}

await main();
