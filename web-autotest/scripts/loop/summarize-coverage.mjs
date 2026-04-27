#!/usr/bin/env node

import { relative } from 'path';
import { createRequire } from 'module';
import { computeFileMetrics } from '../lib/coverage-utils.mjs';
import { displayConfig } from '../lib/config.mjs';
import { toPosix } from '../lib/fs-utils.mjs';
import { requireJsonFile } from '../lib/json-io.mjs';
import { coverageConfigPath, coveragePath, repoRoot } from '../lib/paths.mjs';

const require = createRequire(import.meta.url);
const coverageConfig = require(coverageConfigPath);
const coverage = requireJsonFile(
  coveragePath,
  `Missing coverage report: ${coveragePath}`,
  'Failed to parse coverage report'
);
const thresholds = coverageConfig.thresholds;

const files = Object.entries(coverage).map(([absolutePath, info]) => {
  const metrics = computeFileMetrics(info);

  return {
    file: toPosix(relative(repoRoot, absolutePath)),
    absolutePath,
    metrics,
    deficits: {
      functions: metrics.functions.total - metrics.functions.covered,
      branches: metrics.branches.total - metrics.branches.covered,
      lines: metrics.lines.total - metrics.lines.covered,
    },
  };
});

function aggregate(metricName) {
  const covered = files.reduce((sum, file) => sum + file.metrics[metricName].covered, 0);
  const total = files.reduce((sum, file) => sum + file.metrics[metricName].total, 0);
  const pct = total === 0 ? 100 : (covered / total) * 100;
  const threshold = thresholds[metricName] ?? null;
  return {
    covered,
    total,
    pct,
    threshold,
    passed: threshold == null ? true : pct >= threshold,
  };
}

const summary = {
  lines: aggregate('lines'),
  functions: aggregate('functions'),
  branches: aggregate('branches'),
};

const lowCoverageFiles = [...files]
  .sort((left, right) => {
    const leftScore = left.metrics.branches.pct + left.metrics.lines.pct;
    const rightScore = right.metrics.branches.pct + right.metrics.lines.pct;
    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }
    return (right.deficits.branches + right.deficits.lines) -
      (left.deficits.branches + left.deficits.lines);
  })
  .slice(0, displayConfig.maxLowCoverageFiles);

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  coveragePath: 'web-autotest/reports/coverage/coverage-final.json',
  thresholds: {
    lines: thresholds.lines,
    functions: thresholds.functions,
    branches: thresholds.branches,
  },
  summary,
  lowCoverageFiles,
}, null, 2));
