#!/usr/bin/env node
/**
 * 一键发布脚本
 *
 * 用法:
 *   node scripts/release.mjs           # 默认 patch（0.0.1 → 0.0.2）
 *   node scripts/release.mjs minor     # minor（0.0.1 → 0.1.0）
 *   node scripts/release.mjs major     # major（0.0.1 → 1.0.0）
 *
 * 等效 npm scripts（在 web-autotest/ 目录执行）:
 *   npm run release          # patch
 *   npm run release:minor
 *   npm run release:major
 *
 * 流程:
 *   1. 检查 git 工作区是否干净
 *   2. npm version <bump> --no-git-tag-version  →  仅更新 package.json，不打 tag 不创建 commit
 *   3. git add + git commit  →  提交版本变更
 *   4. npm publish  →  prepublishOnly 自动触发 build，然后推送到 registry
 *   5. git push  →  推送版本提交到远端（不含 tag）
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = join(__dirname, '..');
const pkgPath = join(pkgDir, 'package.json');

// ── 参数解析 ─────────────────────────────────────────────────────────────────
const bump = process.argv[2] || 'patch';
const VALID_BUMPS = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];

if (!VALID_BUMPS.includes(bump)) {
  console.error(`\n错误：无效的版本类型 "${bump}"`);
  console.error(`可选值：${VALID_BUMPS.join(' | ')}`);
  process.exit(1);
}

// ── 工具函数 ─────────────────────────────────────────────────────────────────
function readPkg() {
  return JSON.parse(readFileSync(pkgPath, 'utf8'));
}

function run(cmd) {
  console.log(`\n  $ ${cmd}`);
  const result = spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: pkgDir });
  if (result.status !== 0) {
    console.error(`\n✗ 命令失败（exit ${result.status ?? 'signal'}）: ${cmd}`);
    process.exit(result.status || 1);
  }
}

// ── Step 0：检查工作区 ────────────────────────────────────────────────────────
const dirty = execSync('git status --porcelain', { cwd: pkgDir }).toString().trim();
if (dirty) {
  console.error('\n✗ 工作区有未提交的改动，请先 commit 或 stash：');
  console.error(dirty);
  process.exit(1);
}

// ── 展示版本计划 ──────────────────────────────────────────────────────────────
const { name, version: currentVersion } = readPkg();
console.log(`\n${name} 发布流程`);
console.log(`${'─'.repeat(50)}`);
console.log(`当前版本  ${currentVersion}`);
console.log(`升版类型  ${bump}`);

// ── Step 1：npm version（仅更新 package.json，不打 tag 不创建 commit）────────
run(`npm version ${bump} --no-git-tag-version`);

const newVersion = readPkg().version;
console.log(`\n新版本    ${newVersion}`);

// ── Step 2：git commit 版本变更 ───────────────────────────────────────────────
run(`git add "${pkgPath}"`);
run(`git commit -m "chore: release ${newVersion}"`);

// ── Step 3：npm publish ───────────────────────────────────────────────────────
// prepublishOnly 钩子会自动执行 npm run build（tsc）
run('npm publish');

// ── Step 4：git push ──────────────────────────────────────────────────────────
run('git push');

console.log(`\n${'─'.repeat(50)}`);
console.log(`✓ 发布完成: ${name}@${newVersion}`);
