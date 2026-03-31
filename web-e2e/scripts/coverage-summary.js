#!/usr/bin/env node
/**
 * 覆盖率摘要脚本（基于 NYC 官方报告的兼容封装）
 *
 * 说明：
 * - AUTOTEST.md 的正式覆盖率口径是 NYC 官方结果。
 * - 本脚本只做轻量封装，统一调用 NYC 官方命令，方便本地查看摘要。
 * - 不再自行计算另一套 Kotlin/JS 覆盖率口径，避免与正式门禁结果不一致。
 *
 * 使用方法：
 *   node scripts/coverage-summary.js         # 等价于 node scripts/coverage-report.mjs
 *   node scripts/coverage-summary.js --check # 等价于 node scripts/coverage-report.mjs --check
 */

const { spawnSync } = require('child_process');
const path = require('path');

const e2eRoot = path.join(__dirname, '..');
const scriptPath = path.join(__dirname, 'coverage-report.mjs');
const extraArgs = process.argv.slice(2).filter((arg) => arg === '--check');

const result = spawnSync('node', [scriptPath, ...extraArgs], {
  cwd: e2eRoot,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status || 0);
