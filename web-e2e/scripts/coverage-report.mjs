#!/usr/bin/env node
/**
 * 覆盖率报告生成脚本
 *
 * 自动解析路径，无需手动指定绝对路径，跨机器通用。
 *
 * 使用方法：
 *   node scripts/coverage-report.mjs              # 生成报告
 *   node scripts/coverage-report.mjs --check      # 检查阈值
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const e2eRoot     = join(__dirname, '..');            // web-e2e/
const projectRoot = join(e2eRoot, '..');              // KuiklyUI/ (where h5App.js paths are anchored)
const nycOutput   = join(e2eRoot, '.nyc_output');
const reportDir   = join(e2eRoot, 'reports', 'coverage');

const checkOnly = process.argv.includes('--check');

if (!existsSync(nycOutput)) {
  console.error('❌ .nyc_output 不存在，请先以插桩服务器运行测试');
  console.error('   1. npm run instrument');
  console.error('   2. node scripts/serve-instrumented.mjs &   # 后台启动，无需另开终端');
  console.error('   3. npm test');
  process.exit(1);
}

const baseFlags = [
  `--cwd "${projectRoot}"`,
  `--temp-dir "${nycOutput}"`,
].join(' ');

if (checkOnly) {
  console.log('🎯 检查覆盖率阈值...');
  execSync(`npx nyc check-coverage ${baseFlags}`, { cwd: e2eRoot, stdio: 'inherit' });
  console.log('✅ 覆盖率达标');
} else {
  console.log('📊 生成覆盖率报告...');
  execSync(`npx nyc report ${baseFlags} --report-dir "${reportDir}"`, { cwd: e2eRoot, stdio: 'inherit' });
  console.log(`✅ 报告已生成：${reportDir}/index.html`);
}
