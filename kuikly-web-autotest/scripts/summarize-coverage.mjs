#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const repoRoot = process.cwd();
const coveragePath = join(repoRoot, 'web-e2e', 'reports', 'coverage', 'coverage-final.json');
const nycrcPath = join(repoRoot, 'web-e2e', '.nycrc.json');

if (!existsSync(coveragePath)) {
  console.error(JSON.stringify({ error: `Missing coverage report: ${coveragePath}` }, null, 2));
  process.exit(1);
}

const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
const thresholds = existsSync(nycrcPath)
  ? JSON.parse(readFileSync(nycrcPath, 'utf8'))
  : { lines: 70, functions: 70, statements: 70, branches: 55 };

function summarizeCounter(counterMap) {
  const values = Object.values(counterMap || {});
  const total = values.length;
  const covered = values.filter((value) => Number(value) > 0).length;
  const pct = total === 0 ? 100 : (covered / total) * 100;
  return { covered, total, pct };
}

function summarizeBranches(branchMap) {
  const values = Object.values(branchMap || {}).flatMap((value) => (Array.isArray(value) ? value : []));
  const total = values.length;
  const covered = values.filter((value) => Number(value) > 0).length;
  const pct = total === 0 ? 100 : (covered / total) * 100;
  return { covered, total, pct };
}

const files = Object.entries(coverage).map(([absolutePath, info]) => {
  const statements = summarizeCounter(info.s);
  const functions = summarizeCounter(info.f);
  const branches = summarizeBranches(info.b);
  const lineExecutionValues = Object.keys(info.statementMap || {}).map((key) => Number((info.s || {})[key] || 0));
  const lines = summarizeCounter(lineExecutionValues);

  return {
    file: relative(repoRoot, absolutePath).split('\\').join('/'),
    absolutePath,
    metrics: {
      statements,
      functions,
      branches,
      lines,
    },
    deficits: {
      statements: statements.total - statements.covered,
      functions: functions.total - functions.covered,
      branches: branches.total - branches.covered,
      lines: lines.total - lines.covered,
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
  statements: aggregate('statements'),
  branches: aggregate('branches'),
};

const lowCoverageFiles = [...files]
  .sort((left, right) => {
    const leftScore = left.metrics.branches.pct + left.metrics.lines.pct + left.metrics.statements.pct;
    const rightScore = right.metrics.branches.pct + right.metrics.lines.pct + right.metrics.statements.pct;
    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }
    return (right.deficits.branches + right.deficits.lines + right.deficits.statements) -
      (left.deficits.branches + left.deficits.lines + left.deficits.statements);
  })
  .slice(0, 20);

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  coveragePath: 'web-e2e/reports/coverage/coverage-final.json',
  thresholds: {
    lines: thresholds.lines,
    functions: thresholds.functions,
    statements: thresholds.statements,
    branches: thresholds.branches,
  },
  summary,
  lowCoverageFiles,
}, null, 2));
