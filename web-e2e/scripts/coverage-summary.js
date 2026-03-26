#!/usr/bin/env node
/**
 * 覆盖率摘要脚本
 *
 * 直接从 .nyc_output JSON 聚合覆盖率数据，并通过 source map 反映射到 Kotlin 源文件。
 * 绕过 nyc 的路径解析问题（Windows 绝对路径 C:\ 在 POSIX 环境下被忽略）。
 *
 * 运行模式：
 *   node scripts/coverage-summary.js           # JS 文件级摘要（默认）
 *   node scripts/coverage-summary.js --kotlin  # 按 Kotlin 源文件聚合
 *   node scripts/coverage-summary.js --check   # 仅检查阈值，非零退出码表示未达标
 */
'use strict';
const fs   = require('fs');
const path = require('path');

// ── 参数解析 ──────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const kotlinMode = args.includes('--kotlin');
const checkOnly  = args.includes('--check');

// ── 加载覆盖率 JSON ────────────────────────────────────────────────────────────
const nycDir = path.join(__dirname, '..', '.nyc_output');
if (!fs.existsSync(nycDir)) {
  console.error('❌ .nyc_output 不存在，请先以插桩服务器运行测试');
  console.error('   1. npm run instrument');
  console.error('   2. node scripts/serve-instrumented.mjs &');
  console.error('   3. npm test');
  process.exit(1);
}

const jsonFiles = fs.readdirSync(nycDir).filter(f => f.endsWith('.json'));
if (jsonFiles.length === 0) {
  console.error('❌ .nyc_output 中没有 JSON 文件，请先运行测试');
  process.exit(1);
}

// ── source-map 模块（可选，仅 --kotlin 模式需要）─────────────────────────────
let SourceMapConsumer = null;
if (kotlinMode) {
  try {
    SourceMapConsumer = require('source-map').SourceMapConsumer;
  } catch (e) {
    console.error('❌ 缺少 source-map 依赖，无法使用 --kotlin 模式');
    console.error('   请运行: npm install source-map');
    process.exit(1);
  }
}

// ── 按 JS 文件聚合覆盖数据 ─────────────────────────────────────────────────────
// agg[jsFileName] = { s, f, b, inputSourceMap }
const jsAgg = {};

for (const fname of jsonFiles) {
  const raw = JSON.parse(fs.readFileSync(path.join(nycDir, fname), 'utf8'));
  for (const [srcPath, cov] of Object.entries(raw)) {
    const name = srcPath.split(/[/\\]/).pop();
    if (!jsAgg[name]) {
      jsAgg[name] = { s: {}, b: {}, f: {}, stmtMap: cov.statementMap, inputSourceMap: cov.inputSourceMap };
    }
    for (const [k, v] of Object.entries(cov.s || {})) {
      jsAgg[name].s[k] = (jsAgg[name].s[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(cov.f || {})) {
      jsAgg[name].f[k] = (jsAgg[name].f[k] || 0) + v;
    }
    for (const [k, arr] of Object.entries(cov.b || {})) {
      if (!jsAgg[name].b[k]) jsAgg[name].b[k] = arr.map(() => 0);
      arr.forEach((v, i) => { jsAgg[name].b[k][i] += v; });
    }
  }
}

// ── 辅助：计算覆盖率字符串 ─────────────────────────────────────────────────────
const pct = (h, t) => t ? `${h}/${t} (${Math.round(100 * h / t)}%)` : 'N/A';

// ── JS 模式：直接打印 JS 文件级摘要 ──────────────────────────────────────────
if (!kotlinMode) {
  const W = 40, col = s => s.padEnd(14);
  console.log(`📂 读取 ${jsonFiles.length} 个覆盖率 JSON 文件（JS 文件级）\n`);
  console.log('文件'.padEnd(W) + col('Statements') + col('Functions') + 'Branches');
  console.log('-'.repeat(W + 42));

  let totS=0, totSH=0, totF=0, totFH=0, totB=0, totBH=0;

  for (const [name, data] of Object.entries(jsAgg)) {
    const sv = Object.values(data.s), sh = sv.filter(v => v > 0).length;
    const fv = Object.values(data.f), fh = fv.filter(v => v > 0).length;
    const bv = Object.values(data.b).flatMap(a => a), bh = bv.filter(v => v > 0).length;
    totS += sv.length; totSH += sh;
    totF += fv.length; totFH += fh;
    totB += bv.length; totBH += bh;
    console.log(name.padEnd(W) + col(pct(sh, sv.length)) + col(pct(fh, fv.length)) + pct(bh, bv.length));
  }

  console.log('-'.repeat(W + 42));
  console.log('TOTAL'.padEnd(W) + col(pct(totSH, totS)) + col(pct(totFH, totF)) + pct(totBH, totB));
  printThresholdCheck(totSH, totS, totFH, totF, totBH, totB);
  process.exit(0);
}

// ── Kotlin 模式：通过 source map 反映射，按 Kotlin 文件聚合 ──────────────────
console.log(`📂 读取 ${jsonFiles.length} 个覆盖率 JSON 文件，正在映射到 Kotlin 源文件...\n`);

// ktAgg[ktFileName] = { hit: Set<lineKey>, miss: Set<lineKey> }
// 以"文件:行号"为粒度统计（source map 反映射精度到行）
const ktAgg = {};

for (const [jsName, data] of Object.entries(jsAgg)) {
  if (!data.inputSourceMap) continue;

  let consumer;
  try {
    consumer = new SourceMapConsumer(data.inputSourceMap);
  } catch (e) {
    console.warn(`⚠️  无法解析 ${jsName} 的 source map: ${e.message}`);
    continue;
  }

  for (const [k, hitCount] of Object.entries(data.s)) {
    const stmtLoc = data.stmtMap && data.stmtMap[k];
    if (!stmtLoc) continue;
    const { line, column } = stmtLoc.start;
    let orig;
    try {
      orig = consumer.originalPositionFor({ line, column });
    } catch (e) { continue; }

    if (!orig || !orig.source || orig.line == null) continue;

    // 取 Kotlin 文件名（去掉路径前缀）
    const ktFile = orig.source.split('/').pop();
    if (!ktAgg[ktFile]) ktAgg[ktFile] = { hit: new Set(), miss: new Set() };
    const lineKey = `${ktFile}:${orig.line}`;
    if (hitCount > 0) {
      ktAgg[ktFile].hit.add(lineKey);
      ktAgg[ktFile].miss.delete(lineKey);  // 有测试覆盖则从 miss 移除
    } else if (!ktAgg[ktFile].hit.has(lineKey)) {
      ktAgg[ktFile].miss.add(lineKey);
    }
  }

  try { consumer.destroy(); } catch (e) { /* ignore */ }
}

// ── 打印 Kotlin 文件覆盖率报告 ────────────────────────────────────────────────
const W = 55, col = s => s.padEnd(16);
console.log('Kotlin 文件'.padEnd(W) + col('Lines Hit') + 'Coverage');
console.log('-'.repeat(W + 30));

let totHit = 0, totTotal = 0;

// 按覆盖率升序排列，方便看哪些文件最需要补测
const sorted = Object.entries(ktAgg).sort((a, b) => {
  const rA = a[1].hit.size / (a[1].hit.size + a[1].miss.size);
  const rB = b[1].hit.size / (b[1].hit.size + b[1].miss.size);
  return rA - rB;
});

for (const [name, { hit, miss }] of sorted) {
  const h = hit.size, t = h + miss.size;
  totHit += h; totTotal += t;
  const ratio = t ? Math.round(100 * h / t) : 0;
  const bar = ratio >= 70 ? '✅' : ratio >= 50 ? '⚠️ ' : '❌';
  console.log(name.padEnd(W) + col(`${h}/${t}`) + `${ratio}% ${bar}`);
}

console.log('-'.repeat(W + 30));
const totalRatio = totTotal ? Math.round(100 * totHit / totTotal) : 0;
console.log('TOTAL'.padEnd(W) + col(`${totHit}/${totTotal}`) + `${totalRatio}%`);

// ── 列出覆盖率最低的 Kotlin 文件，帮助确定补测优先级 ─────────────────────────
const LOW_THRESHOLD = 40;
const lowFiles = sorted.filter(([, {hit, miss}]) => {
  const t = hit.size + miss.size;
  return t > 5 && (t ? Math.round(100 * hit.size / t) : 0) < LOW_THRESHOLD;
});
if (lowFiles.length > 0) {
  console.log(`\n📋 覆盖率低于 ${LOW_THRESHOLD}% 的 Kotlin 文件（共 ${lowFiles.length} 个，建议补充测试）：`);
  for (const [name, { hit, miss }] of lowFiles.slice(0, 20)) {
    const t = hit.size + miss.size;
    const ratio = Math.round(100 * hit.size / t);
    console.log(`   ❌ ${name.padEnd(50)} ${ratio}%  (${hit.size}/${t} lines)`);
  }
  if (lowFiles.length > 20) console.log(`   ... 及另外 ${lowFiles.length - 20} 个文件`);
}

// ── 阈值检查（Kotlin 行覆盖率口径）────────────────────────────────────────────
printThresholdCheck(totHit, totTotal, totHit, totTotal, totHit, totTotal, true);

// ── 阈值检查函数 ──────────────────────────────────────────────────────────────
function printThresholdCheck(sH, sT, fH, fT, bH, bT, linesOnly) {
  console.log('\n--- 阈值检查 ---');
  const stmtP   = sT ? Math.round(100 * sH / sT) : 0;
  const funcP   = fT ? Math.round(100 * fH / fT) : 0;
  const branchP = bT ? Math.round(100 * bH / bT) : 0;

  let allPass = true;
  const checks = linesOnly
    ? [['Lines (Kotlin)', stmtP, 70]]
    : [['Statements', stmtP, 70], ['Functions', funcP, 70], ['Branches', branchP, 55]];

  for (const [label, actual, threshold] of checks) {
    const pass = actual >= threshold;
    if (!pass) allPass = false;
    console.log(`  ${pass ? '✅' : '❌'} ${label}: ${actual}% (threshold: ${threshold}%)`);
  }
  console.log(allPass ? '\n✅ 覆盖率达标' : '\n❌ 覆盖率未达标');

  if (checkOnly) process.exit(allPass ? 0 : 1);
}
