#!/usr/bin/env node

import { runSiblingScriptJson, tryRunSiblingScriptJson } from '../lib/script-runner.mjs';

const scan = runSiblingScriptJson('scan-web-test-pages.mjs');
const failures = tryRunSiblingScriptJson('analyze-playwright-results.mjs', 'Playwright JSON report is missing or invalid.');
const coverage = tryRunSiblingScriptJson('summarize-coverage.mjs', 'Coverage summary is missing or invalid.');
const suggestions = tryRunSiblingScriptJson('suggest-test-targets.mjs', 'Coverage target suggestions are unavailable.');

const report = {
  generatedAt: new Date().toISOString(),
  completeness: {
    summary: scan.summary,
    missingSpecs: scan.missingSpecs,
    orphanSpecTargets: scan.orphanSpecTargets,
    specsWithoutGoto: scan.specsWithoutGoto,
  },
  failures,
  coverage,
  suggestions,
};

console.log(JSON.stringify(report, null, 2));
