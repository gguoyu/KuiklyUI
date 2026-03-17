#!/usr/bin/env node

/**
 * Kuikly E2E Test CLI
 * Unified entry point for building, testing, and coverage reporting
 * 
 * Usage:
 *   node web-e2e/scripts/kuikly-test.mjs --full
 *   node web-e2e/scripts/kuikly-test.mjs --level L0
 *   node web-e2e/scripts/kuikly-test.mjs --update-snapshots
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');
const e2eRoot = join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  full: args.includes('--full'),
  level: args.find(arg => arg.startsWith('--level'))?.split('=')[1] || args[args.indexOf('--level') + 1],
  test: args.find(arg => arg.startsWith('--test'))?.split('=')[1] || args[args.indexOf('--test') + 1],
  updateSnapshots: args.includes('--update-snapshots'),
  coverageOnly: args.includes('--coverage-only'),
  skipBuild: args.includes('--skip-build'),
  headed: args.includes('--headed'),
  debug: args.includes('--debug'),
};

console.log('🚀 Kuikly E2E Test CLI');
console.log('Options:', options);

/**
 * Execute shell command
 */
function execCommand(command, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Executing: ${command}`);
    console.log(`📁 Working directory: ${cwd}`);
    
    const child = spawn(command, {
      shell: true,
      cwd,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Build Kotlin/JS project
 */
async function buildProject() {
  if (options.skipBuild) {
    console.log('⏭️  Skipping build (--skip-build)');
    return;
  }

  console.log('\n🔨 Building Kotlin/JS project...');
  
  // Build demo project
  await execCommand('./gradlew :demo:jsBrowserProductionWebpack');
  
  console.log('✅ Build completed');
}

/**
 * Start webpack dev server
 * Note: This is a placeholder. In practice, you may need to:
 * 1. Check if server is already running
 * 2. Start server in background
 * 3. Wait for server to be ready
 */
async function startDevServer() {
  // TODO: Implement dev server start logic
  // For now, assume server is already running at localhost:8080
  console.log('ℹ️  Assuming dev server is running at http://localhost:8080');
  console.log('ℹ️  If not, please start it manually');
}

/**
 * Run Playwright tests
 */
async function runTests() {
  console.log('\n🧪 Running Playwright tests...');
  
  let testCommand = 'npx playwright test';
  
  // Add test level filter
  if (options.level) {
    const levelMap = {
      'L0': 'tests/L0-static',
      'L1': 'tests/L1-interaction',
      'L2': 'tests/L2-complex',
    };
    const testPath = levelMap[options.level];
    if (testPath) {
      testCommand += ` ${testPath}`;
    }
  }
  
  // Add specific test file
  if (options.test) {
    testCommand += ` ${options.test}`;
  }
  
  // Add update snapshots flag
  if (options.updateSnapshots) {
    testCommand += ' --update-snapshots';
  }
  
  // Add headed mode
  if (options.headed) {
    testCommand += ' --headed';
  }
  
  // Add debug mode
  if (options.debug) {
    testCommand += ' --debug';
  }
  
  await execCommand(testCommand, e2eRoot);
  
  console.log('✅ Tests completed');
}

/**
 * Generate coverage report
 */
async function generateCoverageReport() {
  if (!options.full && !options.coverageOnly) {
    console.log('⏭️  Skipping coverage report');
    return;
  }

  console.log('\n📊 Generating coverage report...');
  
  // Check if instrumented code exists
  const instrumentedPath = join(e2eRoot, 'instrumented');
  if (!fs.existsSync(instrumentedPath)) {
    console.log('⚠️  No instrumented code found, skipping coverage');
    return;
  }
  
  await execCommand('npx nyc report', e2eRoot);
  
  console.log('✅ Coverage report generated');
  console.log(`📄 View report: ${join(e2eRoot, 'reports/coverage/index.html')}`);
}

/**
 * Main execution flow
 */
async function main() {
  try {
    if (options.coverageOnly) {
      // Only generate coverage report
      await generateCoverageReport();
    } else {
      // Full flow or test only
      if (!options.skipBuild) {
        await buildProject();
      }
      
      await startDevServer();
      await runTests();
      
      if (options.full) {
        await generateCoverageReport();
      }
    }
    
    console.log('\n✨ All tasks completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run main function
main();
