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
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
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

function walkHtmlFiles(dir) {
  const result = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      result.push(...walkHtmlFiles(fullPath));
      continue;
    }
    if (entry.endsWith('.html')) {
      result.push(fullPath);
    }
  }
  return result;
}

function extractCoverageStatuses(coverageColumnHtml) {
  const matches = [...coverageColumnHtml.matchAll(/cline-any\s+(cline-(?:yes|no|neutral))/g)];
  return matches.map((match) => match[1].replace('cline-', ''));
}

function wrapCodeLinesWithCoverageStatus(codeHtml, statuses) {
  const lines = codeHtml.split('\n');
  if (lines.length !== statuses.length) {
    return null;
  }

  return lines.map((line, index) => {
    const status = statuses[index] || 'neutral';
    return `<span class="code-line code-line-${status}">${line}</span>`;
  }).join('\n');
}

function patchCoverageHtmlFile(filePath) {
  const html = readFileSync(filePath, 'utf8');
  if (!html.includes('<table class="coverage">') || html.includes('code-line code-line-')) {
    return false;
  }

  const tableMatch = html.match(/<td class="line-coverage quiet">([\s\S]*?)<\/td><td class="text"><pre class="prettyprint lang-js">([\s\S]*?)<\/pre><\/td>/);
  if (!tableMatch) {
    return false;
  }

  const [, coverageColumnHtml, codeHtml] = tableMatch;
  const statuses = extractCoverageStatuses(coverageColumnHtml);
  const wrappedCodeHtml = wrapCodeLinesWithCoverageStatus(codeHtml, statuses);
  if (!wrappedCodeHtml) {
    console.warn(`Skipping coverage line post-process due to mismatched line count: ${filePath}`);
    return false;
  }

  const patchedHtml = html.replace(
    '<td class="text"><pre class="prettyprint lang-js">',
    '<td class="text"><pre class="prettyprint lang-js coverage-code">'
  ).replace(codeHtml, wrappedCodeHtml);

  writeFileSync(filePath, patchedHtml);
  return true;
}

function patchCoverageStyles() {
  const baseCssPath = join(reportDir, 'base.css');
  const marker = '/* kuikly coverage code line highlighting */';
  const cssPatch = `

${marker}
td.text {
  width: 100%;
}

pre.prettyprint.lang-js.coverage-code {
  display: block;
}

.code-line {
  display: block;
  margin: 0 -0.75em;
  padding: 0 0.75em;
}

.code-line-yes {
  background: rgba(230, 245, 208, 0.75);
}

.code-line-no {
  background: rgba(252, 225, 229, 0.9);
}

.code-line-neutral {
  background: rgba(234, 234, 234, 0.45);
}

.highlighted .code-line-yes,
.highlighted .code-line-no,
.highlighted .code-line-neutral {
  box-shadow: inset 3px 0 0 #00000022;
}
`;

  const baseCss = readFileSync(baseCssPath, 'utf8');
  if (!baseCss.includes(marker)) {
    writeFileSync(baseCssPath, `${baseCss}${cssPatch}`);
  }
}

function postProcessCoverageReport() {
  if (!existsSync(reportDir)) {
    return;
  }

  patchCoverageStyles();

  const htmlFiles = walkHtmlFiles(reportDir);
  let patchedCount = 0;
  for (const filePath of htmlFiles) {
    if (patchCoverageHtmlFile(filePath)) {
      patchedCount += 1;
    }
  }
  console.log(`Coverage report style enhancement complete, processed ${patchedCount} file pages`);
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
  postProcessCoverageReport();
  console.log(`✅ 报告已生成：${reportDir}/index.html`);
}
