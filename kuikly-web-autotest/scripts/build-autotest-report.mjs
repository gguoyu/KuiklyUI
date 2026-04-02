#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { join } from 'path';

const repoRoot = process.cwd();
const skillScripts = join(repoRoot, 'kuikly-web-autotest', 'scripts');

function runScript(scriptName) {
  const output = execFileSync(process.execPath, [join(skillScripts, scriptName)], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

const scan = runScript('scan-web-test-pages.mjs');
let failures = null;
let coverage = null;
let suggestions = null;

try {
  failures = runScript('analyze-playwright-results.mjs');
} catch {
  failures = { error: 'Playwright JSON report is missing or invalid.' };
}

try {
  coverage = runScript('summarize-coverage.mjs');
} catch {
  coverage = { error: 'Coverage summary is missing or invalid.' };
}

try {
  suggestions = runScript('suggest-test-targets.mjs');
} catch {
  suggestions = { error: 'Coverage target suggestions are unavailable.' };
}

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
