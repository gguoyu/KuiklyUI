#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute } from 'path';
import webE2EConfig from '../config/index.cjs';
import { resolvePlaywrightTargets, resolveBusinessTargets, resolveBusinessLevelTargets } from './lib/classification-policy.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..');   // scripts/ 上溯一级 → 包根目录
const projectRoot = process.env.KUIKLY_PROJECT_ROOT || process.cwd();
const autotestDirEnv = process.env.KUIKLY_AUTOTEST_DIR;
const e2eRoot = autotestDirEnv
  ? (isAbsolute(autotestDirEnv) ? autotestDirEnv : join(projectRoot, autotestDirEnv))
  : join(projectRoot, 'web-autotest');
const { build, coverage, reporting, runtime } = webE2EConfig;
const defaultPort = String(runtime.resolvePort());

// Business mode detection
let _autotestConfig;
let _isBusinessMode = false;
try {
  // Dynamic import of CJS module helpers for business mode
  const { createRequire } = await import('module');
  const _require = createRequire(import.meta.url);
  const { loadAutotestConfig, isBusinessMode } = _require(join(packageRoot, 'config', 'load-autotest-config.cjs'));
  _autotestConfig = loadAutotestConfig();
  _isBusinessMode = isBusinessMode(_autotestConfig);
} catch (e) {
  // Config not found — framework mode fallback
}

// Gradle wrapper selection:
// - In a MSYS/Git-Bash shell on Windows, spawn with shell:true uses cmd.exe which cannot
//   run ./gradlew or gradlew.bat directly. We invoke bash explicitly instead.
// - On plain Windows (cmd/PowerShell), gradlew.bat works fine.
// - On Unix/Mac, ./gradlew works.
const isWin = process.platform === 'win32';
const isMsysShell = Boolean(process.env.MSYSTEM || process.env.MINGW_PREFIX || process.env.CYGWIN);
let gradleWrapper;
if (isWin && isMsysShell) {
  // Running inside Git Bash / MSYS2 on Windows — use bash to execute the sh wrapper
  gradleWrapper = `bash "${join(projectRoot, 'gradlew').replace(/\\/g, '/')}"`;
} else if (isWin) {
  // Plain Windows cmd / PowerShell — use the .bat wrapper via absolute path
  gradleWrapper = `"${join(projectRoot, 'gradlew.bat')}"`;
} else {
  gradleWrapper = './gradlew';
}
const gradleBuildArgs = build.gradleBuildArgs;

const args = process.argv.slice(2);
const valueFlags = ['--level', '--test', '--biz', '--biz-type'];
const booleanFlags = new Set([
  '--full',
  '--update-snapshots',
  '--coverage-only',
  '--skip-build',
  '--headed',
  '--debug',
  '--dry-run',
  '--print-resolved-targets',
]);

function collectPassthroughArgs(argv) {
  const passthrough = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (booleanFlags.has(arg)) {
      continue;
    }

    if (valueFlags.includes(arg)) {
      index += 1;
      continue;
    }

    if (valueFlags.some((flag) => arg.startsWith(`${flag}=`))) {
      continue;
    }

    passthrough.push(arg);
  }

  return passthrough;
}

function getArg(flag) {
  const eq = args.find((arg) => arg.startsWith(`${flag}=`));
  if (eq) {
    return eq.split('=').slice(1).join('=');
  }

  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : true;
}

const options = {
  full: args.includes('--full'),
  level: getArg('--level'),
  test: getArg('--test'),
  biz: getArg('--biz'),
  bizType: getArg('--biz-type'),
  updateSnapshots: args.includes('--update-snapshots'),
  coverageOnly: args.includes('--coverage-only'),
  skipBuild: args.includes('--skip-build'),
  headed: args.includes('--headed'),
  debug: args.includes('--debug'),
  dryRun: args.includes('--dry-run'),
  printResolvedTargets: args.includes('--print-resolved-targets'),
  passthroughArgs: collectPassthroughArgs(args),
};

console.log('Kuikly E2E Test CLI');
console.log('Options:', options);

function quoteArg(arg) {
  return /[\s"]/u.test(arg) ? JSON.stringify(arg) : arg;
}

function logResolvedTargets(resolution) {
  if (!resolution) {
    return;
  }

  console.log('[kuikly-test] resolved level:', {
    requestedLevel: resolution.requestedLevel,
    normalizedLevel: resolution.normalizedLevel,
    targets: resolution.targets,
  });
}

function execCommand(command, cwd = projectRoot, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning: ${command}`);
    console.log(`CWD    : ${cwd}`);

    const child = spawn(command, {
      shell: true,
      cwd,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (exit code ${code}): ${command}`));
    });
    child.on('error', reject);
  });
}

function clearCoverageOutput() {
  const v8OutputDir = join(e2eRoot, reporting.v8TempDirName);
  if (existsSync(v8OutputDir)) {
    rmSync(v8OutputDir, { recursive: true, force: true });
    console.log(`Cleared previous coverage data: ${v8OutputDir}`);
  }
}

async function buildProject() {
  if (options.skipBuild) {
    console.log('--skip-build: skip Gradle build');
    return;
  }

  if (_isBusinessMode && options.biz && _autotestConfig) {
    const biz = _autotestConfig.businesses && _autotestConfig.businesses.find(b => b.name === options.biz);
    if (biz && biz.buildCommand) {
      console.log(`\n[kuikly-test] Building business: ${biz.displayName || biz.name}...`);
      await execCommand(biz.buildCommand, projectRoot);
      return;
    }
  }

  console.log('\nBuilding h5App compileSync modules and demo bundle with Gradle...');
  await execCommand(`${gradleWrapper} ${gradleBuildArgs}`, projectRoot, { KUIKLY_USE_LOCAL_KSP: 'false' });
  console.log('Build completed');
}

async function runTests({ collectCoverage = false } = {}) {
  console.log(`\nRunning Playwright tests${collectCoverage ? ' (V8 coverage mode)' : ''}...`);

  let cmd = 'npx playwright test';
  const levelResolution = options.level ? resolvePlaywrightTargets(options.level) : null;

  if (_isBusinessMode && options.biz) {
    // Business mode: target = tests/<biz>/[<bizType>/]
    const resolved = resolveBusinessTargets(options.biz, options.bizType || null);
    if (resolved && resolved.targets.length) {
      cmd += ' ' + resolved.targets.map(quoteArg).join(' ');
    }
  } else if (_isBusinessMode && options.level) {
    // Business mode + level without biz: run across all businesses
    const resolved = resolveBusinessLevelTargets(options.level);
    if (resolved && resolved.targets.length) {
      cmd += ' ' + resolved.targets.map(quoteArg).join(' ');
    }
  } else if (levelResolution?.targets?.length) {
    // Framework mode (existing logic)
    cmd += ' ' + levelResolution.targets.map(quoteArg).join(' ');
  } else if (options.level) {
    console.warn(`[kuikly-test] Unknown level: ${options.level}, running full suite`);
  }

  if (options.test) cmd += ` ${quoteArg(options.test)}`;
  if (options.updateSnapshots) cmd += ' --update-snapshots';
  if (options.headed) cmd += ' --headed';
  if (options.debug) cmd += ' --debug';
  if (options.passthroughArgs.length > 0) {
    cmd += ' ' + options.passthroughArgs.map(quoteArg).join(' ');
  }

  if (levelResolution && (options.dryRun || options.printResolvedTargets)) {
    logResolvedTargets(levelResolution);
  }

  if (options.dryRun) {
    console.log(`[kuikly-test] dry run command: ${cmd}`);
    return;
  }

  const extraEnv = collectCoverage
    ? {
        KUIKLY_COLLECT_V8_COVERAGE: 'true',
        KUIKLY_PORT: String(defaultPort),
        KUIKLY_PROJECT_ROOT: projectRoot,
        KUIKLY_AUTOTEST_DIR: e2eRoot,
      }
    : {
        KUIKLY_PROJECT_ROOT: projectRoot,
        KUIKLY_AUTOTEST_DIR: e2eRoot,
      };

  await execCommand(cmd, e2eRoot, extraEnv);
  console.log('Tests completed');
}

async function generateCoverageReport() {
  const v8OutputDir = join(e2eRoot, reporting.v8TempDirName);

  if (!existsSync(v8OutputDir)) {
    throw new Error('.v8_output does not exist, run V8 coverage tests first');
  }

  console.log('\nGenerating Kotlin coverage report with Monocart (V8 data)...');
  await execCommand(`node "${join(packageRoot, 'scripts', 'coverage-report.mjs')}"`, e2eRoot, {
    KUIKLY_PROJECT_ROOT: projectRoot,
    KUIKLY_AUTOTEST_DIR: e2eRoot,
  });
  console.log('Kotlin coverage report generated');
  console.log(`Report: ${join(e2eRoot, reporting.coverageIndexFile)}`);
}

async function checkCoverageThresholds() {
  console.log('\nChecking V8 Kotlin coverage thresholds...');
  await execCommand(`node "${join(packageRoot, 'scripts', 'coverage-report.mjs')}" --check`, e2eRoot, {
    KUIKLY_PROJECT_ROOT: projectRoot,
    KUIKLY_AUTOTEST_DIR: e2eRoot,
  });
  console.log('Coverage thresholds passed');
}

async function main() {
  try {
    if (options.coverageOnly) {
      await generateCoverageReport();
      await checkCoverageThresholds();
    } else if (options.full) {
      await buildProject();
      clearCoverageOutput();
      await runTests({ collectCoverage: true });
      await generateCoverageReport();
      await checkCoverageThresholds();
    } else {
      await runTests();
    }

    console.log('\nAll tasks finished');
    process.exitCode = 0;
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
