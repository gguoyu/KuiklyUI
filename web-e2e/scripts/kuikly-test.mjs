#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, rmSync } from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');
const e2eRoot = join(__dirname, '..');
const defaultPort = process.env.KUIKLY_PORT || '8080';
const gradleWrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradleBuildArgs = ':demo:packLocalJSBundleDebug -Pkuikly.useLocalKsp=false';
const instrumentedDefaultWorkers = '2';

const args = process.argv.slice(2);

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
  updateSnapshots: args.includes('--update-snapshots'),
  coverageOnly: args.includes('--coverage-only'),
  instrumentOnly: args.includes('--instrument'),
  withNative: args.includes('--with-native'),
  skipBuild: args.includes('--skip-build'),
  headed: args.includes('--headed'),
  debug: args.includes('--debug'),
};

console.log('Kuikly E2E Test CLI');
console.log('Options:', options);

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

function waitForChildExit(child, timeoutMs) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve(true);
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);

    const handleExit = () => {
      cleanup();
      resolve(true);
    };

    const cleanup = () => {
      clearTimeout(timer);
      child.off('exit', handleExit);
      child.off('close', handleExit);
    };

    child.once('exit', handleExit);
    child.once('close', handleExit);
  });
}

function waitForHttpReady(port, timeoutMs, child) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      if (child.exitCode !== null) {
        reject(new Error(`Instrumented server exited before becoming ready (exit code ${child.exitCode})`));
        return;
      }

      const req = http.get(
        {
          hostname: '127.0.0.1',
          port: Number(port),
          path: '/',
          timeout: 1500,
        },
        (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) {
            resolve();
            return;
          }
          if (Date.now() >= deadline) {
            reject(new Error(`Instrumented server did not become ready on port ${port}`));
            return;
          }
          setTimeout(tryConnect, 500);
        }
      );

      req.on('error', () => {
        if (Date.now() >= deadline) {
          reject(new Error(`Instrumented server did not become ready on port ${port}`));
          return;
        }
        setTimeout(tryConnect, 500);
      });

      req.on('timeout', () => {
        req.destroy();
      });
    };

    tryConnect();
  });
}

async function startInstrumentedServer(port) {
  console.log(`\nStarting instrumented test server (port ${port})...`);

  const child = spawn('node', ['scripts/serve-instrumented.mjs'], {
    cwd: e2eRoot,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
  });

  child.on('error', (error) => {
    console.error('Failed to start instrumented server:', error.message);
  });

  await waitForHttpReady(port, 30_000, child);
  console.log('Instrumented server is ready');
  return child;
}

async function stopInstrumentedServer(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  console.log('\nStopping instrumented test server...');

  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    await new Promise((resolve) => killer.on('close', resolve));
    const exited = await waitForChildExit(child, 5_000);
    if (exited) {
      console.log('Instrumented server stopped');
      return;
    }
  } else {
    child.kill('SIGINT');
    const exited = await waitForChildExit(child, 5_000);
    if (exited) {
      console.log('Instrumented server stopped');
      return;
    }
  }

  child.kill();
  const exited = await waitForChildExit(child, 3_000);
  console.log(exited ? 'Instrumented server stopped' : 'Instrumented server was force closed');
}

function clearCoverageOutput() {
  const nycOutputDir = join(e2eRoot, '.nyc_output');
  if (existsSync(nycOutputDir)) {
    rmSync(nycOutputDir, { recursive: true, force: true });
    console.log(`Cleared previous coverage data: ${nycOutputDir}`);
  }
}

async function buildProject() {
  if (options.skipBuild) {
    console.log('--skip-build: skip Gradle build');
    return;
  }

  console.log('\nBuilding demo bundle with Gradle...');
  await execCommand(`${gradleWrapper} ${gradleBuildArgs}`, projectRoot, { KUIKLY_USE_LOCAL_KSP: 'false' });
  console.log('Build completed');
}

async function instrumentCode() {
  console.log('\nRunning Istanbul instrumentation...');
  const nativeFlag = options.withNative ? ' --with-native' : '';
  await execCommand(`node scripts/instrument.mjs${nativeFlag}`, e2eRoot);
  console.log('Instrumentation completed');
}

async function runTests({ instrumented = false } = {}) {
  console.log(`\nRunning Playwright tests${instrumented ? ' (instrumented mode)' : ''}...`);

  let cmd = 'npx playwright test';
  const levelMap = {
    L0: 'tests/L0-static',
    L1: 'tests/L1-simple',
    L2: 'tests/L2-complex',
  };

  if (options.level) {
    const levelPath = levelMap[String(options.level).toUpperCase()];
    if (levelPath) cmd += ` ${levelPath}`;
    else console.warn(`Unknown level: ${options.level}, running full suite`);
  }

  if (options.test) cmd += ` ${options.test}`;
  if (options.updateSnapshots) cmd += ' --update-snapshots';
  if (options.headed) cmd += ' --headed';
  if (options.debug) cmd += ' --debug';
  if (instrumented) {
    cmd += ' --workers=' + instrumentedDefaultWorkers;
    console.log('[kuikly-test] instrumented mode fixed workers=2');
  }

  const extraEnv = instrumented
    ? {
        KUIKLY_SKIP_WEBSERVER: 'true',
        KUIKLY_INSTRUMENTED: 'true',
        KUIKLY_PORT: String(defaultPort),
        KUIKLY_WORKERS: instrumentedDefaultWorkers,
      }
    : {};

  await execCommand(cmd, e2eRoot, extraEnv);
  console.log('Tests completed');
}

async function generateCoverageReport() {
  const nycOutputDir = join(e2eRoot, '.nyc_output');

  if (!existsSync(nycOutputDir)) {
    throw new Error('.nyc_output does not exist, run instrumented tests first');
  }

  console.log('\nGenerating official NYC Kotlin coverage report...');
  await execCommand('node scripts/coverage-report.mjs', e2eRoot);
  console.log('NYC Kotlin coverage report generated');
  console.log(`Report: ${join(e2eRoot, 'reports/coverage/index.html')}`);
}

async function checkCoverageThresholds() {
  console.log('\nChecking coverage thresholds from .nycrc.json...');
  await execCommand('node scripts/coverage-report.mjs --check', e2eRoot);
  console.log('Coverage thresholds passed');
}

async function main() {
  let serverProcess = null;

  try {
    if (options.coverageOnly) {
      await generateCoverageReport();
      await checkCoverageThresholds();
    } else if (options.instrumentOnly) {
      await buildProject();
      await instrumentCode();
    } else if (options.full) {
      await buildProject();
      await instrumentCode();
      clearCoverageOutput();
      serverProcess = await startInstrumentedServer(defaultPort);
      await runTests({ instrumented: true });
      await stopInstrumentedServer(serverProcess);
      serverProcess = null;
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
  } finally {
    await stopInstrumentedServer(serverProcess);
  }
}

main();
