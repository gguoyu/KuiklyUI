#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const repoRoot = process.cwd();
const reportPath = join(repoRoot, 'web-e2e', 'reports', 'test-results.json');

if (!existsSync(reportPath)) {
  console.error(JSON.stringify({ error: `Missing report: ${reportPath}` }, null, 2));
  process.exit(1);
}

const raw = readFileSync(reportPath, 'utf8');
const statusMatch = raw.match(/"status"\s*:\s*"(failed|timedOut|interrupted)"/);
const hasFailureSignal = Boolean(statusMatch);

let report;
try {
  report = JSON.parse(raw);
} catch (error) {
  console.error(JSON.stringify({ error: `Failed to parse Playwright report: ${error.message}` }, null, 2));
  process.exit(1);
}

function classifyFailure(message) {
  const text = message || '';
  if (/Screenshot comparison failed|pixels? are different/i.test(text)) {
    return 'SCREENSHOT_DIFF';
  }
  if (/locator|waiting for|Timeout .* locator|element/i.test(text)) {
    return 'ELEMENT_NOT_FOUND';
  }
  if (/net::ERR|crash|crashed|Target page, context or browser has been closed/i.test(text)) {
    return 'PAGE_CRASH';
  }
  if (/Timeout .* exceeded|timed out/i.test(text)) {
    return 'TIMEOUT';
  }
  if (/expect\(|toBe|toEqual|toHaveText|toHaveCSS|toContainText|Expected/i.test(text)) {
    return 'ASSERTION_FAILED';
  }
  return 'UNKNOWN';
}

function firstNonEmpty(values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return '';
}

function walkSuites(suites, parentTitles, failures) {
  for (const suite of suites || []) {
    const nextTitles = suite.title ? [...parentTitles, suite.title] : parentTitles;

    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const failingResults = (test.results || []).filter((result) => {
          return result.status && !['passed', 'skipped'].includes(result.status);
        });

        for (const result of failingResults) {
          const message = firstNonEmpty([
            result.error?.message,
            ...(result.errors || []).map((error) => error?.message || ''),
          ]);

          failures.push({
            specFile: spec.file || suite.file || '',
            suitePath: nextTitles,
            title: spec.title,
            testStatus: result.status,
            retry: result.retry ?? 0,
            duration: result.duration ?? null,
            category: classifyFailure(message),
            message,
          });
        }
      }
    }

    walkSuites(suite.suites || [], nextTitles, failures);
  }
}

const failures = [];
walkSuites(report.suites || [], [], failures);

const categories = {};
for (const failure of failures) {
  categories[failure.category] = (categories[failure.category] || 0) + 1;
}

const result = {
  generatedAt: new Date().toISOString(),
  reportPath: 'web-e2e/reports/test-results.json',
  summary: {
    expected: report.stats?.expected ?? 0,
    unexpected: report.stats?.unexpected ?? 0,
    flaky: report.stats?.flaky ?? 0,
    skipped: report.stats?.skipped ?? 0,
    durationMs: report.stats?.duration ?? null,
    failedCount: failures.length,
    failureCategories: categories,
    failureSignalDetected: hasFailureSignal,
  },
  failures,
};

console.log(JSON.stringify(result, null, 2));
