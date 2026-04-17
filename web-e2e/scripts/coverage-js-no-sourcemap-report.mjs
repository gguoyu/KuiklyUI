#!/usr/bin/env node
/**
 * Generate a JS-level HTML coverage report without sourcemap remapping.
 *
 * It merges raw coverage from .nyc_output, keeps only compiled Kotlin JS modules,
 * removes inputSourceMap from each file coverage entry, and renders HTML directly
 * against the generated JS files.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { join, dirname, normalize } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import webE2EConfig from '../config/index.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const { coverage: coverageConfig } = webE2EConfig;

const e2eRoot = join(__dirname, '..');
const projectRoot = join(e2eRoot, '..');
const nycOutputDir = join(e2eRoot, '.nyc_output');
const generatedJsRoot = normalize(join(projectRoot, coverageConfig.generatedKotlinOutputDir));
const reportDir = join(e2eRoot, 'reports', 'coverage-js-no-sourcemap-html');
const coverageJsonPath = join(reportDir, 'coverage-final.json');

if (!existsSync(nycOutputDir)) {
  console.error('.nyc_output does not exist, run instrumented coverage tests first');
  console.error('Recommended: node scripts/kuikly-test.mjs --full');
  process.exit(1);
}

function isGeneratedKotlinModule(filePath) {
  const normalizedPath = normalize(filePath);
  return normalizedPath.startsWith(generatedJsRoot) && normalizedPath.endsWith('.js');
}

function buildFileCoverage(filePath, fileCoverage) {
  const clonedCoverage = JSON.parse(JSON.stringify(fileCoverage));
  delete clonedCoverage.inputSourceMap;
  clonedCoverage.path = normalize(filePath);
  return clonedCoverage;
}

function mergeRawGeneratedJsCoverage() {
  const mergedCoverage = libCoverage.createCoverageMap({});

  for (const entry of readdirSync(nycOutputDir)) {
    if (!entry.endsWith('.json')) {
      continue;
    }

    const fullPath = join(nycOutputDir, entry);
    const rawCoverage = JSON.parse(readFileSync(fullPath, 'utf8'));

    for (const [filePath, fileCoverage] of Object.entries(rawCoverage)) {
      if (!isGeneratedKotlinModule(filePath)) {
        continue;
      }

      const normalizedPath = normalize(filePath);
      mergedCoverage.merge({
        [normalizedPath]: buildFileCoverage(normalizedPath, fileCoverage),
      });
    }
  }

  return mergedCoverage;
}

function writeCoverageJson(coverageMap) {
  const sortedCoverage = Object.fromEntries(
    Object.entries(coverageMap.toJSON()).sort(([left], [right]) => left.localeCompare(right))
  );
  writeFileSync(coverageJsonPath, `${JSON.stringify(sortedCoverage, null, 2)}\n`);
}

function generateReport() {
  const coverageMap = mergeRawGeneratedJsCoverage();

  rmSync(reportDir, { recursive: true, force: true });
  mkdirSync(reportDir, { recursive: true });
  writeCoverageJson(coverageMap);

  const context = libReport.createContext({
    dir: reportDir,
    coverageMap,
    defaultSummarizer: 'flat',
  });

  reports.create('html').execute(context);
  reports.create('text-summary').execute(context);

  console.log(`JS coverage report generated: ${reportDir}/index.html`);
}

generateReport();
