#!/usr/bin/env node
/**
 * Kuikly E2E Test CLI（统一入口）
 *
 * 使用方法：
 *   node web-e2e/scripts/kuikly-test.mjs [options]
 *
 * 常用命令：
 *   --full              全流程：插桩 → 启动服务器 → 运行全量测试 → 生成覆盖率报告
 *   --level L0|L1|L2    只运行指定级别的测试
 *   --test <file>       只运行指定测试文件
 *   --update-snapshots  更新截图基准
 *   --coverage-only     仅生成覆盖率报告（基于已有 .nyc_output）
 *   --instrument        仅执行插桩步骤
 *   --with-native       插桩时同时处理 nativevue2.js（默认仅 h5App.js）
 *   --skip-build        跳过 Gradle 构建步骤
 *   --headed            以有界面模式运行 Playwright
 *   --debug             以调试模式运行 Playwright
 *
 * 示例：
 *   node web-e2e/scripts/kuikly-test.mjs --level L0 --skip-build
 *   node web-e2e/scripts/kuikly-test.mjs --full --with-native
 *   node web-e2e/scripts/kuikly-test.mjs --coverage-only
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const projectRoot = join(__dirname, '../..');
const e2eRoot     = join(__dirname, '..');

// ── 参数解析 ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  // 支持 --flag=value 和 --flag value 两种写法
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=').slice(1).join('=');
  return args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : true;
}

const options = {
  full:            args.includes('--full'),
  level:           getArg('--level'),
  test:            getArg('--test'),
  updateSnapshots: args.includes('--update-snapshots'),
  coverageOnly:    args.includes('--coverage-only'),
  instrumentOnly:  args.includes('--instrument'),
  withNative:      args.includes('--with-native'),
  skipBuild:       args.includes('--skip-build'),
  headed:          args.includes('--headed'),
  debug:           args.includes('--debug'),
};

console.log('🚀 Kuikly E2E Test CLI');
console.log('Options:', options);

// ── 工具函数 ────────────────────────────────────────────────────────────────

function execCommand(command, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Running: ${command}`);
    console.log(`📁 CWD    : ${cwd}`);

    const child = spawn(command, { shell: true, cwd, stdio: 'inherit' });

    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (exit code ${code}): ${command}`));
    });
    child.on('error', reject);
  });
}

// ── 各步骤 ──────────────────────────────────────────────────────────────────

/** Step 1: Gradle 构建 */
async function buildProject() {
  if (options.skipBuild) {
    console.log('⏭️  --skip-build: 跳过 Gradle 构建');
    return;
  }
  console.log('\n🔨 构建 Kotlin/JS 项目（开发模式，含 source map）...');
  // 使用 developmentExecutable 以保留 source map，便于覆盖率映射
  await execCommand('./gradlew :demo:jsBrowserDevelopmentWebpack :h5App:jsBrowserDevelopmentWebpack');
  console.log('✅ 构建完成');
}

/** Step 2: Istanbul 插桩 */
async function instrumentCode() {
  console.log('\n🔬 执行 Istanbul 插桩...');
  const nativeFlag = options.withNative ? ' --with-native' : '';
  await execCommand(`node scripts/instrument.mjs${nativeFlag}`, e2eRoot);
  console.log('✅ 插桩完成');
}

/** Step 3: 运行 Playwright 测试 */
async function runTests() {
  console.log('\n🧪 运行 Playwright 测试...');

  let cmd = 'npx playwright test';

  // 测试级别路径映射（L1-simple 对应实际目录名）
  const levelMap = {
    'L0': 'tests/L0-static',
    'L1': 'tests/L1-simple',
    'L2': 'tests/L2-complex',
  };

  if (options.level) {
    const path = levelMap[String(options.level).toUpperCase()];
    if (path) cmd += ` ${path}`;
    else console.warn(`⚠️  未知级别: ${options.level}，将运行全量测试`);
  }

  if (options.test)            cmd += ` ${options.test}`;
  if (options.updateSnapshots) cmd += ' --update-snapshots';
  if (options.headed)          cmd += ' --headed';
  if (options.debug)           cmd += ' --debug';

  await execCommand(cmd, e2eRoot);
  console.log('✅ 测试完成');
}

/** Step 4: 生成覆盖率报告 */
async function generateCoverageReport() {
  const nycOutputDir = join(e2eRoot, '.nyc_output');

  if (!existsSync(nycOutputDir)) {
    console.log('⚠️  .nyc_output 不存在，跳过覆盖率报告');
    console.log('   提示：请先使用插桩服务器运行测试（npm run serve:instrumented）');
    return;
  }

  console.log('\n📊 生成覆盖率报告...');
  await execCommand('npx nyc report', e2eRoot);
  console.log('✅ 覆盖率报告已生成');
  console.log(`📄 查看报告: ${join(e2eRoot, 'reports/coverage/index.html')}`);
}

/** Step 5: 覆盖率阈值检查 */
async function checkCoverageThresholds() {
  console.log('\n🎯 检查覆盖率阈值（基于 .nycrc.json 配置）...');
  try {
    await execCommand('npx nyc check-coverage', e2eRoot);
    console.log('✅ 覆盖率达标');
  } catch {
    console.error('❌ 覆盖率未达到阈值（lines/functions/statements ≥ 70%，branches ≥ 55%）');
    throw new Error('Coverage thresholds not met');
  }
}

// ── 主流程 ──────────────────────────────────────────────────────────────────

async function main() {
  try {
    if (options.coverageOnly) {
      // 仅生成报告
      await generateCoverageReport();
      await checkCoverageThresholds();

    } else if (options.instrumentOnly) {
      // 仅执行插桩
      await buildProject();
      await instrumentCode();

    } else if (options.full) {
      // 全流程：构建 → 插桩 → 测试 → 报告
      await buildProject();
      await instrumentCode();
      console.log('\nℹ️  请确保已启动插桩服务器：npm run serve:instrumented');
      await runTests();
      await generateCoverageReport();
      await checkCoverageThresholds();

    } else {
      // 默认：直接运行测试（使用普通服务器，无覆盖率）
      await runTests();
    }

    console.log('\n✨ 所有任务执行完毕！');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ 错误:', e.message);
    process.exit(1);
  }
}

main();
