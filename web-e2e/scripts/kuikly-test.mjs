#!/usr/bin/env node
/**
 * Kuikly E2E Test CLI（统一入口）
 *
 * 设计目标：
 * - 本地一键闭环执行：构建 → 插桩 → 启动插桩服务器 → 执行测试 → 生成 NYC 官方 Kotlin 文件覆盖率报告 → 阈值检查
 * - `--full` 是日常标准入口；无 `--full` 时保留普通 Playwright 运行路径，供本地单轮调试使用
 *
 * 使用方法：
 *   node web-e2e/scripts/kuikly-test.mjs [options]
 *
 * 常用命令：
 *   --full              全流程：构建 → 插桩 → 启动插桩服务器 → 测试 → NYC 官方 Kotlin 文件覆盖率报告 → 阈值检查
 *   --level L0|L1|L2    只运行指定级别的测试
 *   --test <file>       只运行指定测试文件
 *   --update-snapshots  更新截图基准
 *   --coverage-only     仅生成 NYC 官方 Kotlin 文件覆盖率报告并检查阈值（基于已有 .nyc_output）
 *   --instrument        仅执行插桩步骤
 *   --with-native       插桩时同时处理 nativevue2.js（调试辅助口径，不改变正式门禁口径；默认仅 h5App.js）
 *   --skip-build        跳过 Gradle 构建步骤
 *   --headed            以有界面模式运行 Playwright
 *   --debug             以调试模式运行 Playwright
 */

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

const args = process.argv.slice(2);

function getArg(flag) {
  const eq = args.find((a) => a.startsWith(`${flag}=`));
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

console.log('🚀 Kuikly E2E Test CLI');
console.log('Options:', options);

function execCommand(command, cwd = projectRoot, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Running: ${command}`);
    console.log(`📁 CWD    : ${cwd}`);

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  console.log(`\n🛰️  启动插桩版测试服务器（port ${port}）...`);

  const child = spawn('node', ['scripts/serve-instrumented.mjs'], {
    cwd: e2eRoot,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
  });

  child.on('error', (error) => {
    console.error('❌ 插桩服务器启动失败:', error.message);
  });

  await waitForHttpReady(port, 30_000, child);
  console.log('✅ 插桩服务器已就绪');
  return child;
}

async function stopInstrumentedServer(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  console.log('\n🛑 关闭插桩版测试服务器...');
  child.kill('SIGINT');

  for (let i = 0; i < 20; i += 1) {
    if (child.exitCode !== null) {
      console.log('✅ 插桩服务器已关闭');
      return;
    }
    await sleep(250);
  }

  child.kill();
  console.log('⚠️  插桩服务器已强制关闭');
}

function clearCoverageOutput() {
  const nycOutputDir = join(e2eRoot, '.nyc_output');
  if (existsSync(nycOutputDir)) {
    rmSync(nycOutputDir, { recursive: true, force: true });
    console.log(`🧹 已清理旧覆盖率数据: ${nycOutputDir}`);
  }
}

async function buildProject() {
  if (options.skipBuild) {
    console.log('⏭️  --skip-build: 跳过 Gradle 构建');
    return;
  }

  console.log('\n🔨 构建 Kotlin/JS 项目（开发模式，含 source map）...');
  await execCommand('./gradlew :demo:jsBrowserDevelopmentWebpack :h5App:jsBrowserDevelopmentWebpack');
  console.log('✅ 构建完成');
}

async function instrumentCode() {
  console.log('\n🔬 执行 Istanbul 插桩...');
  const nativeFlag = options.withNative ? ' --with-native' : '';
  await execCommand(`node scripts/instrument.mjs${nativeFlag}`, e2eRoot);
  console.log('✅ 插桩完成');
}

async function runTests({ instrumented = false } = {}) {
  console.log(`\n🧪 运行 Playwright 测试${instrumented ? '（插桩模式）' : ''}...`);

  let cmd = 'npx playwright test';
  const levelMap = {
    L0: 'tests/L0-static',
    L1: 'tests/L1-simple',
    L2: 'tests/L2-complex',
  };

  if (options.level) {
    const levelPath = levelMap[String(options.level).toUpperCase()];
    if (levelPath) cmd += ` ${levelPath}`;
    else console.warn(`⚠️  未知级别: ${options.level}，将运行全量测试`);
  }

  if (options.test) cmd += ` ${options.test}`;
  if (options.updateSnapshots) cmd += ' --update-snapshots';
  if (options.headed) cmd += ' --headed';
  if (options.debug) cmd += ' --debug';

  const extraEnv = instrumented
    ? {
        KUIKLY_SKIP_WEBSERVER: 'true',
        KUIKLY_INSTRUMENTED: 'true',
        KUIKLY_PORT: String(defaultPort),
      }
    : {};

  await execCommand(cmd, e2eRoot, extraEnv);
  console.log('✅ 测试完成');
}

async function generateCoverageReport() {
  const nycOutputDir = join(e2eRoot, '.nyc_output');

  if (!existsSync(nycOutputDir)) {
    throw new Error('.nyc_output 不存在，请先运行插桩测试（例如 node scripts/kuikly-test.mjs --full）');
  }

  console.log('\n📊 生成 NYC 官方 Kotlin 文件覆盖率报告...');
  await execCommand('node scripts/coverage-report.mjs', e2eRoot);
  console.log('✅ NYC 官方 Kotlin 文件覆盖率报告已生成');
  console.log(`📄 查看报告: ${join(e2eRoot, 'reports/coverage/index.html')}`);
}

async function checkCoverageThresholds() {
  console.log('\n🎯 检查覆盖率阈值（基于 .nycrc.json 配置）...');
  await execCommand('node scripts/coverage-report.mjs --check', e2eRoot);
  console.log('✅ 覆盖率达标');
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
      await generateCoverageReport();
      await checkCoverageThresholds();
    } else {
      await runTests();
    }

    console.log('\n✨ 所有任务执行完毕！');
    process.exitCode = 0;
  } catch (e) {
    console.error(`\n❌ 错误: ${e.message}`);
    process.exitCode = 1;
  } finally {
    await stopInstrumentedServer(serverProcess);
  }
}

main();
