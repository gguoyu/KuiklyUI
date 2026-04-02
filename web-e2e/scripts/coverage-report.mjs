#!/usr/bin/env node
/**
 * NYC 官方 Kotlin 文件覆盖率报告脚本
 *
 * 统一口径：
 * - 基于 `.nyc_output/` 中的浏览器运行时覆盖率数据
 * - 由 NYC 官方命令生成/检查报告
 * - 通过 source map 将结果映射回 Kotlin 源文件维度
 *
 * 说明：
 * - 在当前 Windows + Kotlin/JS source map 场景下，`nyc report` 直接读取原始 `.nyc_output/`
 *   时可能出现 remap 后文件被再次 exclude 导致报告为空的问题。
 * - 这里先用 `nyc merge` 生成统一的 remap 后 coverage JSON，再在报告阶段显式关闭
 *   `exclude-after-remap`，以确保官方 NYC 报告能够正确展示 Kotlin 文件覆盖率。
 * - 当前正式统计口径进一步收敛为：仅统计 `core-render-web/base` 与 `core-render-web/h5`
 *   两个目录下的 Kotlin 文件；合并后的 remap 结果会在本脚本内再次过滤，避免 NYC include
 *   在 remap 后未完全生效时把其他 Kotlin 文件带入门禁。
 *
 * 使用方法：
 *   node scripts/coverage-report.mjs              # 生成 NYC 官方 Kotlin 文件覆盖率报告
 *   node scripts/coverage-report.mjs --check      # 检查阈值
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, dirname, normalize } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const e2eRoot = join(__dirname, '..');
const projectRoot = join(e2eRoot, '..');
const nycOutputDir = join(e2eRoot, '.nyc_output');
const mergedTempDir = join(e2eRoot, '.nyc_merged');
const mergedJson = join(mergedTempDir, 'out.json');
const reportDir = join(e2eRoot, 'reports', 'coverage');
const nycrcPath = join(e2eRoot, '.nycrc.json');
const checkOnly = process.argv.includes('--check');
const coverageScopeRoots = [
  normalize(join(projectRoot, 'core-render-web', 'base', 'src', 'jsMain', 'kotlin')),
  normalize(join(projectRoot, 'core-render-web', 'h5', 'src', 'jsMain', 'kotlin')),
];

if (!existsSync(nycOutputDir)) {
  console.error('❌ .nyc_output 不存在，请先运行插桩覆盖率测试');
  console.error('   推荐方式：node scripts/kuikly-test.mjs --full');
  process.exit(1);
}

function prepareMergedCoverage() {
  if (existsSync(mergedTempDir)) {
    rmSync(mergedTempDir, { recursive: true, force: true });
  }
  mkdirSync(mergedTempDir, { recursive: true });

  console.log('🧩 合并原始覆盖率数据...');
  execSync(`npx nyc merge "${nycOutputDir}" "${mergedJson}"`, {
    cwd: e2eRoot,
    stdio: 'inherit',
  });

  filterMergedCoverage();
}

function isInCoverageScope(filePath) {
  const normalizedPath = normalize(filePath);
  return coverageScopeRoots.some((root) => normalizedPath.startsWith(root));
}

function filterMergedCoverage() {
  const mergedCoverage = JSON.parse(readFileSync(mergedJson, 'utf8'));
  const filteredCoverage = Object.fromEntries(
    Object.entries(mergedCoverage).filter(([filePath]) => isInCoverageScope(filePath))
  );

  writeFileSync(mergedJson, `${JSON.stringify(filteredCoverage, null, 2)}\n`);
  console.log(`🧹 覆盖率过滤后保留 ${Object.keys(filteredCoverage).length} 个 Kotlin 文件（仅 core-render-web/base 与 core-render-web/h5）`);
}

function buildBaseFlags() {
  return [
    `--cwd "${projectRoot}"`,
    `--temp-dir "${mergedTempDir}"`,
    `--nycrc-path "${nycrcPath}"`,
    '--exclude-after-remap=false',
  ].join(' ');
}

prepareMergedCoverage();
const baseFlags = buildBaseFlags();

if (checkOnly) {
  console.log('🎯 使用 NYC 官方 Kotlin 文件覆盖率口径检查阈值...');
  execSync(`npx nyc check-coverage ${baseFlags}`, { cwd: e2eRoot, stdio: 'inherit' });
  console.log('✅ 覆盖率达标');
} else {
  console.log('📊 使用 NYC 官方 Kotlin 文件覆盖率口径生成 NYC 官方 Kotlin 文件覆盖率报告...');
  execSync(`npx nyc report ${baseFlags} --report-dir "${reportDir}" --no-check-coverage`, {
    cwd: e2eRoot,
    stdio: 'inherit',
  });
  console.log(`✅ 报告已生成：${reportDir}/index.html`);
}