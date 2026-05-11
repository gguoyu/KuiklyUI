#!/usr/bin/env node
/**
 * run-biz-autotest-loop.mjs — Business-mode AI automated test closed-loop.
 *
 * Usage:
 *   node scripts/loop/run-biz-autotest-loop.mjs --biz <name> [options]
 */

import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { basename, dirname, join, relative } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { repoRoot, packageRoot, autotestDir, reportsDir as baseReportsDir, testsRoot } from '../lib/paths.mjs';
import { walkFiles } from '../lib/fs-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const _require = createRequire(import.meta.url);
const { loadAutotestConfig, isBusinessMode } = _require(
  join(packageRoot, 'config', 'load-autotest-config.cjs')
);

const reportsDir = join(baseReportsDir, 'biz-autotest');

// ── CLI ─────────────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);

function hasFlag(flag) { return rawArgs.includes(flag); }

function getArg(flag) {
  const exact = rawArgs.find((a) => a.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const idx = rawArgs.indexOf(flag);
  if (idx === -1) return null;
  const next = rawArgs[idx + 1];
  return (!next || next.startsWith('--')) ? null : next;
}

function parseIntArg(flag, fallback) {
  const value = getArg(flag);
  if (value == null) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n < 0) {
    console.error(`\`${flag}\` must be a non-negative integer.`);
    process.exit(1);
  }
  return n;
}

const options = {
  biz: getArg('--biz'),
  maxRounds: parseIntArg('--max-rounds', 3),
  maxNewSpecs: parseIntArg('--max-new-specs', 10),
  skipBuild: hasFlag('--skip-build'),
  updateSnapshots: hasFlag('--update-snapshots'),
  headed: hasFlag('--headed'),
  dryRun: hasFlag('--dry-run'),
};

if (!options.biz) {
  console.error(
    '[biz-autotest-loop] Error: --biz <business_name> is required.\n\n' +
    'Usage:\n' +
    '  node scripts/loop/run-biz-autotest-loop.mjs --biz <name> [options]\n\n' +
    'Options:\n' +
    '  --max-rounds <n>      Maximum loop rounds (default: 3)\n' +
    '  --max-new-specs <n>   Maximum new specs per round (default: 10)\n' +
    '  --skip-build          Skip the build step\n' +
    '  --update-snapshots    Update Playwright snapshots\n' +
    '  --headed              Run browser in headed mode\n' +
    '  --dry-run             Print actions without executing'
  );
  process.exit(1);
}

// ── Config ──────────────────────────────────────────────────────────────────

const autotestConfig = loadAutotestConfig();

if (!isBusinessMode(autotestConfig)) {
  console.error('[biz-autotest-loop] Error: Project is not in business mode.');
  process.exit(1);
}

const businesses = autotestConfig.businesses || [];
const bizConfig = businesses.find((b) => b.name === options.biz);

if (!bizConfig) {
  console.error(`[biz-autotest-loop] Error: Business "${options.biz}" not found.`);
  console.error(`  Available: ${businesses.map((b) => b.name).join(', ') || '(none)'}`);
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
}

function runCommand(label, command, args, { allowFailure = false } = {}) {
  console.log(`\n[biz-autotest-loop] ${label}`);
  console.log(`[biz-autotest-loop] cmd: ${command} ${args.join(' ')}`);
  if (options.dryRun) {
    console.log('[biz-autotest-loop] (dry-run, skipped)');
    return { status: 0, failed: false };
  }
  const result = spawnSync(command, args, {
    cwd: repoRoot, stdio: 'inherit', shell: false,
    env: { ...process.env, KUIKLY_PROJECT_ROOT: repoRoot },
  });
  const status = result.status ?? 1;
  if (status !== 0 && !allowFailure) {
    throw new Error(`${label} failed with exit code ${status}`);
  }
  return { status, failed: status !== 0 };
}

// ── Core Functions ──────────────────────────────────────────────────────────

function scanBusinessPages(bizName) {
  console.log(`\n[biz-autotest-loop] Scanning pages for: ${bizName}`);
  const scriptPath = join(__dirname, 'scan-biz-pages.mjs');
  if (options.dryRun) {
    console.log(`[biz-autotest-loop] (dry-run) Would run: node ${scriptPath} --biz ${bizName}`);
    return [];
  }
  const result = spawnSync(process.execPath, [scriptPath, '--biz', bizName], {
    cwd: repoRoot, encoding: 'utf8', shell: false,
    env: { ...process.env, KUIKLY_PROJECT_ROOT: repoRoot },
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    console.warn(`[biz-autotest-loop] scan-biz-pages exited with code ${result.status}`);
    if (stderr) console.warn(`  stderr: ${stderr}`);
    return [];
  }
  const stdout = (result.stdout || '').trim();
  if (!stdout) return [];
  try { return JSON.parse(stdout); }
  catch (err) {
    console.warn(`[biz-autotest-loop] Failed to parse scan output: ${err.message}`);
    return [];
  }
}

function findExistingSpecs(bizName) {
  const bizTestDir = join(testsRoot, bizName);
  if (!existsSync(bizTestDir)) return [];
  return walkFiles(bizTestDir, (f) => f.endsWith('.spec.ts'));
}

function findUncoveredPages(pages, existingSpecs) {
  const specBasenames = existingSpecs.map((s) => basename(s).toLowerCase());
  return pages.filter((page) => {
    const pageName = (page.pageName || page.name || '').toLowerCase();
    const className = (page.className || '').toLowerCase();
    return !specBasenames.some((spec) =>
      (pageName && spec.includes(pageName)) || (className && spec.includes(className))
    );
  });
}

function generateSpecInstructions(pages, bizName) {
  const bizTestDir = join(testsRoot, bizName);
  const visualDir = join(bizTestDir, 'visual');
  const functionalDir = join(bizTestDir, 'functional');

  return pages.map((page) => {
    const pageName = page.pageName || page.name || 'unknown';
    const sourceFile = page.sourceFile || page.filePath || '';
    const visualSpec = join(visualDir, `${pageName}.visual.spec.ts`);
    const functionalSpec = join(functionalDir, `${pageName}.functional.spec.ts`);

    return {
      page: pageName,
      sourceFile,
      actions: [
        `Read the source file: ${sourceFile}`,
        `Reference biz-spec-templates.md for spec structure`,
        `Generate visual spec -> ${relative(repoRoot, visualSpec)}`,
        `Generate functional spec -> ${relative(repoRoot, functionalSpec)}`,
      ],
      outputs: {
        visualSpec: relative(repoRoot, visualSpec),
        functionalSpec: relative(repoRoot, functionalSpec),
      },
    };
  });
}

function runTests(bizName) {
  const kuiklyTestPath = join(packageRoot, 'scripts', 'kuikly-test.mjs');
  const args = [kuiklyTestPath, '--skip-build', '--biz', bizName];
  if (options.updateSnapshots) args.push('--update-snapshots');
  if (options.headed) args.push('--headed');
  return runCommand(`Running tests for: ${bizName}`, process.execPath, args, { allowFailure: true });
}

function walkSuites(suites, parentTitles, failures) {
  for (const suite of suites) {
    const titles = suite.title ? [...parentTitles, suite.title] : parentTitles;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        for (const r of (test.results || []).filter((r) => r.status && !['passed', 'skipped'].includes(r.status))) {
          const message = r.error?.message
            || (r.errors || []).map((e) => e?.message || '').find(Boolean) || '';
          failures.push({
            file: spec.file || suite.file || '',
            testName: spec.title || '',
            suitePath: titles,
            error: message,
            status: r.status,
          });
        }
      }
    }
    walkSuites(suite.suites || [], titles, failures);
  }
}

function analyzeResults() {
  const possiblePaths = [
    join(baseReportsDir, 'test-results.json'),
    join(baseReportsDir, 'autotest', 'test-results.json'),
    join(autotestDir, 'reports', 'test-results.json'),
  ];
  const reportPath = possiblePaths.find((p) => existsSync(p));
  if (!reportPath) {
    console.warn('[biz-autotest-loop] No Playwright JSON report found.');
    return { total: 0, passed: 0, failed: 0, failures: [] };
  }
  let report;
  try { report = JSON.parse(readFileSync(reportPath, 'utf8')); }
  catch (err) {
    console.warn(`[biz-autotest-loop] Failed to parse report: ${err.message}`);
    return { total: 0, passed: 0, failed: 0, failures: [] };
  }
  const stats = report.stats || {};
  const total = (stats.expected || 0) + (stats.unexpected || 0) + (stats.flaky || 0);
  const failures = [];
  walkSuites(report.suites || [], [], failures);
  return { total, passed: stats.expected || 0, failed: stats.unexpected || 0, failures };
}

function generateRepairInstructions(failures) {
  return failures.map((f) => ({
    specFile: f.file,
    testName: f.testName,
    error: f.error,
    actions: [
      `Read the failing spec at ${f.file}`,
      `Analyze the error: ${f.error}`,
      `Fix the spec - adjust selectors, timeouts, or assertions as needed`,
      `Save the fixed spec`,
    ],
  }));
}

function saveRoundReport(bizName, round, data) {
  ensureDir(reportsDir);
  const filePath = join(reportsDir, `${bizName}-round-${round}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[biz-autotest-loop] Report saved: ${relative(repoRoot, filePath)}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('[biz-autotest-loop] KuiklyUI Business Autotest Loop');
  console.log(`  Business:       ${options.biz}`);
  console.log(`  Max rounds:     ${options.maxRounds}`);
  console.log(`  Max new specs:  ${options.maxNewSpecs}`);
  console.log(`  Skip build:     ${options.skipBuild}`);
  console.log(`  Dry run:        ${options.dryRun}`);
  console.log('');

  // Step 1: Build (optional)
  if (!options.skipBuild && bizConfig.buildCommand) {
    const parts = bizConfig.buildCommand.split(' ');
    runCommand(`Building: ${options.biz}`, parts[0], parts.slice(1));
  } else if (!options.skipBuild) {
    console.log('[biz-autotest-loop] No buildCommand configured, skipping build.');
  }

  // Step 2: Loop rounds
  let totalNewSpecs = 0;
  let lastTestResult = null;

  for (let round = 1; round <= options.maxRounds; round++) {
    console.log(`\n${'─'.repeat(20)} Round ${round}/${options.maxRounds} ${'─'.repeat(20)}`);

    // (a) Scan pages
    const pages = scanBusinessPages(options.biz);
    console.log(`[biz-autotest-loop] Scanned ${pages.length} page(s).`);

    // (b) Find uncovered pages
    const existingSpecs = findExistingSpecs(options.biz);
    const uncovered = findUncoveredPages(pages, existingSpecs);
    console.log(`[biz-autotest-loop] Specs: ${existingSpecs.length}, Uncovered: ${uncovered.length}`);

    // (c) Generate spec instructions
    let newSpecInstructions = [];
    const budget = options.maxNewSpecs - totalNewSpecs;

    if (uncovered.length > 0 && budget > 0) {
      const batch = uncovered.slice(0, budget);
      newSpecInstructions = generateSpecInstructions(batch, options.biz);
      totalNewSpecs += batch.length;
      console.log(`\n[biz-autotest-loop] AI Spec Instructions (${batch.length} page(s)):`);
      for (const instr of newSpecInstructions) {
        console.log(`  Page: ${instr.page}`);
        instr.actions.forEach((a) => console.log(`    - ${a}`));
      }
    } else if (uncovered.length === 0) {
      console.log('[biz-autotest-loop] All pages covered.');
    } else {
      console.log(`[biz-autotest-loop] New spec budget exhausted (${options.maxNewSpecs}).`);
    }

    // (d) Run tests
    runTests(options.biz);

    // (e) Analyze results
    const analysis = analyzeResults();
    lastTestResult = analysis;
    console.log(`\n[biz-autotest-loop] Results: ${analysis.passed} passed, ${analysis.failed} failed, ${analysis.total} total`);

    // (f) Repair instructions
    let repairInstructions = [];
    if (analysis.failures.length > 0) {
      repairInstructions = generateRepairInstructions(analysis.failures);
      console.log(`\n[biz-autotest-loop] Repair Instructions (${repairInstructions.length}):`);
      for (const r of repairInstructions) {
        console.log(`  Spec: ${r.specFile} | Test: ${r.testName}`);
        console.log(`  Error: ${r.error.slice(0, 120)}${r.error.length > 120 ? '...' : ''}`);
        r.actions.forEach((a) => console.log(`    - ${a}`));
      }
    }

    // Save report
    saveRoundReport(options.biz, round, {
      round,
      business: options.biz,
      scanResult: { totalPages: pages.length, uncoveredPages: uncovered.length },
      newSpecInstructions,
      testResult: { total: analysis.total, passed: analysis.passed, failed: analysis.failed },
      repairInstructions,
    });

    // (g) Exit conditions
    if (analysis.failed === 0 && uncovered.length === 0) {
      console.log('\n[biz-autotest-loop] All passing & covered. Done.');
      break;
    }
    if (round === options.maxRounds) {
      console.log(`\n[biz-autotest-loop] Reached max rounds (${options.maxRounds}).`);
    }
  }

  // Step 3: Summary
  console.log('\n[biz-autotest-loop] === Summary ===');
  console.log(`  Business:         ${options.biz}`);
  console.log(`  New specs queued: ${totalNewSpecs}`);
  if (lastTestResult) {
    console.log(`  Final:            ${lastTestResult.passed} passed, ${lastTestResult.failed} failed, ${lastTestResult.total} total`);
  }
  console.log(`  Reports:          ${relative(repoRoot, reportsDir)}`);
  console.log('');

  if (lastTestResult && lastTestResult.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[biz-autotest-loop] Fatal:', err.message);
  process.exit(1);
});
