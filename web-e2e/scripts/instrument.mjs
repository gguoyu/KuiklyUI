#!/usr/bin/env node
/**
 * Istanbul 插桩脚本
 *
 * 【实现说明】
 * 正式覆盖率口径仍然是“NYC 官方 Kotlin 文件覆盖率结果”。
 * 但在当前 webpack developmentExecutable 构建下，最终产物 h5App.js 使用 eval-source-map devtool，
 * 所有模块代码被 eval() 包裹，Istanbul 无法直接穿透最终 bundle 插桩，
 * 否则整个 h5App.js 只能得到极少量外层 wrapper statement。
 *
 * 因此当前实现会插桩 webpack 打包**前**的 Kotlin 模块 JS 文件：
 *   h5App/build/compileSync/js/main/developmentExecutable/kotlin/
 *     KuiklyCore-render-web-base.js   (~18000 行，~10000 statements)
 *     KuiklyCore-render-web-h5.js     (~6000 行，~3800 statements)
 *     KuiklyUI-h5App.js               (~1500 行，~900 statements)
 *     kotlin-kotlin-stdlib.js         (标准库，可选插桩)
 *
 * 插桩后由 serve-instrumented.mjs 以 /modules/<name> 路由提供，
 * 同时生成一个同名 h5App.js loader 替代原始 bundle，
 * 按顺序加载各模块后调用入口函数启动渲染引擎。
 *
 * 这属于“为 NYC 官方 Kotlin 覆盖率流程服务的实现细节”，
 * 不是引入另一套独立覆盖率口径。
 *
 * 使用方法：
 *   node scripts/instrument.mjs                  # 插桩 Kotlin 模块文件
 *   node scripts/instrument.mjs --with-native    # 同时插桩 nativevue2.js（调试辅助口径）
 *   node scripts/instrument.mjs --skip-if-exists # 已存在则跳过
 *
 * 输出：
 *   instrumented/
 *     modules/
 *       KuiklyCore-render-web-base.js   (插桩版，含 source map 注释)
 *       KuiklyCore-render-web-base.js.map
 *       KuiklyCore-render-web-h5.js     (插桩版)
 *       KuiklyCore-render-web-h5.js.map
 *       KuiklyUI-h5App.js               (插桩版)
 *       KuiklyUI-h5App.js.map
 *     h5App.js                          (loader 脚本，按顺序加载 modules/)
 *     nativevue2.js                     (可选，插桩版)
 *     index.html                        (nativevue2 URL 已改为本地)
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const e2eRoot    = join(__dirname, '..');
const projectRoot = join(e2eRoot, '..');

// 源文件路径
// Kotlin 模块 JS 文件（webpack 打包前，Istanbul 可正常插桩）
const KOTLIN_MODULES_DIR = join(
  projectRoot,
  'h5App', 'build', 'compileSync', 'js', 'main', 'developmentExecutable', 'kotlin'
);
// nativevue2.js 来自 demo 模块
const NATIVE_BUILD_DIR = join(projectRoot, 'demo', 'build', 'dist', 'js', 'developmentExecutable');
// index.html 模板
const INDEX_HTML_SRC = join(projectRoot, 'h5App', 'build', 'processedResources', 'js', 'main', 'index.html');

// 输出目录
const INSTRUMENTED_DIR  = join(e2eRoot, 'instrumented');
const MODULES_OUT_DIR   = join(INSTRUMENTED_DIR, 'modules');
const NYC_BIN = join(
  e2eRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'nyc.cmd' : 'nyc'
);

// 需要插桩的核心模块（不含 kotlin-stdlib，避免覆盖率被标准库拉低）
const TARGET_MODULES = [
  'KuiklyCore-render-web-base.js',
  'KuiklyCore-render-web-h5.js',
  'KuiklyUI-h5App.js',
];

// 解析参数
const args = process.argv.slice(2);
const withNative   = args.includes('--with-native');
const skipIfExists = args.includes('--skip-if-exists');

function execSyncWithNodePath(command, options = {}) {
  const mergedOptions = { ...options };
  let rewrittenCommand = command;
  if (command.startsWith('npx nyc ')) {
    rewrittenCommand = `${NYC_BIN} ${command.slice('npx nyc '.length)}`;
  }
  mergedOptions.env = {
    ...process.env,
    NODE_PATH: join(e2eRoot, 'node_modules'),
    ...(options.env ?? {}),
  };
  return execSync(rewrittenCommand, mergedOptions);
}

function log(msg)  { console.log(`[instrument] ${msg}`); }
function warn(msg) { console.warn(`[instrument] ⚠️  ${msg}`); }
function err(msg)  { console.error(`[instrument] ❌ ${msg}`); }

function extractInlineSourceMap(code) {
  const match = code.match(/\/\/# sourceMappingURL=data:application\/json(?:;charset=[^;,]+)?;base64,([^\s]+)/);
  if (!match) {
    return null;
  }
  return JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
}

function stripSourceMapComments(code) {
  return code
    .replace(/\/\/[@#]\s+sourceMappingURL=[^\r\n]*/g, '')
    .replace(/\/\*[@#]\s+sourceMappingURL=[\s\S]*?\*\//g, '')
    .trimEnd();
}

function normalizeInstrumentedModuleSourceMaps() {
  for (const name of TARGET_MODULES) {
    const jsPath = join(MODULES_OUT_DIR, name);
    const mapName = `${name}.map`;
    const mapPath = join(MODULES_OUT_DIR, mapName);
    const fallbackMapPath = join(KOTLIN_MODULES_DIR, mapName);

    if (!existsSync(jsPath)) {
      warn(`Instrumented module not found: ${jsPath}`);
      continue;
    }

    const code = readFileSync(jsPath, 'utf8');
    const inlineMap = extractInlineSourceMap(code);

    if (inlineMap) {
      writeFileSync(mapPath, JSON.stringify(inlineMap), 'utf8');
      writeFileSync(
        jsPath,
        `${stripSourceMapComments(code)}\n//# sourceMappingURL=${mapName}\n`,
        'utf8'
      );
      log(`Normalized instrumented source map: ${mapName}`);
    } else if (existsSync(fallbackMapPath)) {
      copyFileSync(fallbackMapPath, mapPath);
      log(`Copied original source map as fallback: ${mapName}`);
    } else {
      warn(`Source map not found (coverage will be JS-level only): ${mapName}`);
    }
  }
}

// ── 插桩 Kotlin 模块目录 ───────────────────────────────────────────────────────

function instrumentModules() {
  if (!existsSync(KOTLIN_MODULES_DIR)) {
    err(`Kotlin modules dir not found: ${KOTLIN_MODULES_DIR}`);
    err('Please run: ./gradlew :h5App:compileDevelopmentExecutableKotlinJs');
    process.exit(1);
  }

  if (skipIfExists && existsSync(MODULES_OUT_DIR)) {
    log('Already instrumented (--skip-if-exists): ' + MODULES_OUT_DIR);
    return;
  }

  mkdirSync(MODULES_OUT_DIR, { recursive: true });

  // 验证目标模块都存在
  for (const name of TARGET_MODULES) {
    const src = join(KOTLIN_MODULES_DIR, name);
    if (!existsSync(src)) {
      err(`Target module not found: ${src}`);
      process.exit(1);
    }
  }

  log('Instrumenting Kotlin modules:');
  log(`  src → ${KOTLIN_MODULES_DIR}`);
  log(`  out → ${MODULES_OUT_DIR}`);

  // nyc instrument 目录模式：将整个目录插桩，只取我们需要的文件
  const relSrc = path.relative(projectRoot, KOTLIN_MODULES_DIR);
  const relOut = path.relative(projectRoot, MODULES_OUT_DIR);

  try {
    execSyncWithNodePath(
      `npx nyc instrument --source-map=true --no-compact "${relSrc}" "${relOut}"`,
      { cwd: projectRoot, stdio: 'inherit' }
    );
    log('✅ Instrumentation done');
  } catch (e) {
    err('Failed to instrument: ' + e.message);
    process.exit(1);
  }

  normalizeInstrumentedModuleSourceMaps();
}

// ── 生成 h5App.js loader 脚本 ──────────────────────────────────────────────────
//
// 原来的 h5App.js 是 webpack eval-bundle，无法插桩。
// 这里生成一个替代 loader，功能等价：
//   1. 通过 <script> 按顺序加载 modules/ 目录下的各模块文件
//   2. 各模块文件是独立的 Kotlin IR 编译产物（CommonJS-like 模块系统），
//      已由 Kotlin 运行时自行处理依赖和执行顺序
//
// Kotlin/JS IR 产物的模块格式是 "plain"（无 require/define），
// 每个文件直接挂到全局 _ 命名空间，顺序加载即可。

function generateLoaderScript() {
  // 非目标模块（kotlin-stdlib 等）也需要先加载（运行时依赖）
  // 顺序：stdlib → dom-compat → render-web-base → render-web-h5 → h5App
  const allModules = readdirSync(KOTLIN_MODULES_DIR)
    .filter(f => f.endsWith('.js') && !f.endsWith('.map'))
    .sort();

  // 将 TARGET_MODULES 放到最后，其余模块（stdlib 等）放前面
  const nonTarget = allModules.filter(m => !TARGET_MODULES.includes(m));
  const orderedModules = [...nonTarget, ...TARGET_MODULES];

  // 生成严格串行加载的 URL 数组字面量
  const urlArray = orderedModules.map(name => {
    const isTarget = TARGET_MODULES.includes(name);
    const prefix   = isTarget ? '/modules' : '/kotlin-modules';
    return `    '${prefix}/${name}'`;
  }).join(',\n');

  const loader = `/**
 * KuiklyUI h5App 覆盖率 Loader
 *
 * 此文件由 instrument.mjs 自动生成，替代 webpack eval-bundle 版的 h5App.js。
 * 以严格串行方式加载各 Kotlin 模块文件（插桩版），保证 UMD 依赖顺序正确。
 *
 * 核心模块（已 Istanbul 插桩，覆盖率有效）：
${TARGET_MODULES.map(m => ' *   /modules/' + m).join('\n')}
 *
 * 运行时依赖（未插桩，覆盖率不计入）：
${nonTarget.map(m => ' *   /kotlin-modules/' + m).join('\n')}
 */
(function () {
  'use strict';

  // Kotlin/JS UMD 模块通过 globalThis['模块名'] 传递依赖，必须严格串行加载。
  // 并行加载会导致依赖找不到，抛出 "dependency was not found" 错误。
  var MODULES = [
${urlArray}
  ];

  var index = 0;

  function loadNext() {
    if (index >= MODULES.length) return;
    var src = MODULES[index++];
    var s = document.createElement('script');
    s.src = src;
    s.onload = loadNext;
    s.onerror = function () {
      console.error('[kuikly-loader] Failed to load: ' + src);
    };
    document.head.appendChild(s);
  }

  loadNext();
})();
`;

  const loaderDst = join(INSTRUMENTED_DIR, 'h5App.js');
  writeFileSync(loaderDst, loader, 'utf8');
  log(`Generated h5App.js loader → ${loaderDst}`);
  log(`  Core modules (instrumented): ${TARGET_MODULES.length}`);
  log(`  Runtime modules (passthrough): ${nonTarget.length}`);
}

// ── 提供原版（未插桩）Kotlin 模块的静态目录 ──────────────────────────────────
// serve-instrumented.mjs 会将 /kotlin-modules/* 路由到这个目录

function copyKotlinModulesPassthrough() {
  // 非 TARGET 的模块（如 kotlin-stdlib）直接从原目录提供，无需复制
  // serve-instrumented.mjs 会直接从 KOTLIN_MODULES_DIR 读取
  log(`Runtime modules served from: ${KOTLIN_MODULES_DIR}`);
}

// ── 处理 nativevue2.js（可选）────────────────────────────────────────────────

function instrumentNative() {
  if (!existsSync(NATIVE_BUILD_DIR)) {
    warn(`nativevue2 dir not found, skipping: ${NATIVE_BUILD_DIR}`);
    return;
  }

  const nativeOutDir = join(INSTRUMENTED_DIR, 'native-src');
  const relSrc = path.relative(projectRoot, NATIVE_BUILD_DIR);
  const relOut = path.relative(projectRoot, nativeOutDir);

  log('Instrumenting nativevue2.js:');
  try {
    execSyncWithNodePath(
      `npx nyc instrument --source-map=true "${relSrc}" "${relOut}"`,
      { cwd: projectRoot, stdio: 'inherit' }
    );
    const srcJs  = join(nativeOutDir, 'nativevue2.js');
    const destJs = join(INSTRUMENTED_DIR, 'nativevue2.js');
    if (existsSync(srcJs)) {
      copyFileSync(srcJs, destJs);
      log('Promoted nativevue2.js → instrumented/nativevue2.js');
    }
  } catch (e) {
    warn('Failed to instrument nativevue2.js: ' + e.message);
  }
}

// ── 处理 index.html ───────────────────────────────────────────────────────────

function patchIndexHtml() {
  if (!existsSync(INDEX_HTML_SRC)) {
    warn(`index.html not found: ${INDEX_HTML_SRC}`);
    return;
  }

  let html = readFileSync(INDEX_HTML_SRC, 'utf8');

  // 将 nativevue2.js 远程 URL 改为本地
  html = html.replace(
    /src="http:\/\/127\.0\.0\.1:8083\/nativevue2\.js"/g,
    'src="nativevue2.js"'
  );
  log('Patched index.html: nativevue2.js URL → local');

  const destHtml = join(INSTRUMENTED_DIR, 'index.html');
  writeFileSync(destHtml, html, 'utf8');
  log(`Copied index.html → ${destHtml}`);
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

log('Starting Istanbul instrumentation...');
log(`Project root  : ${projectRoot}`);
log(`e2e root      : ${e2eRoot}`);
log(`With native   : ${withNative}`);

mkdirSync(INSTRUMENTED_DIR, { recursive: true });
log(`Output dir    : ${INSTRUMENTED_DIR}`);

// 1. 插桩 Kotlin 模块目录（核心）
instrumentModules();

// 2. 生成 loader 脚本（替代 webpack eval-bundle）
generateLoaderScript();

// 3. 记录 runtime 模块路径（serve-instrumented 直接从 build 目录提供）
copyKotlinModulesPassthrough();

// 4. 插桩 nativevue2.js（可选）
if (withNative) {
  instrumentNative();
} else {
  log('Skipping nativevue2.js (use --with-native to include)');
}

// 5. 处理 index.html
patchIndexHtml();

log('\n✅ Instrumentation complete!');
log(`Instrumented files in: ${INSTRUMENTED_DIR}`);
log(`  - instrumented/modules/     (${TARGET_MODULES.length} instrumented Kotlin modules)`);
log(`  - instrumented/h5App.js     (loader script)`);
log('\nNext step:');
log('  node scripts/kuikly-test.mjs --full    # 标准入口，自动启动插桩版服务器并执行完整闭环');
log('  npm run serve:instrumented             # 仅用于本地排障时单独启动插桩版服务器');
