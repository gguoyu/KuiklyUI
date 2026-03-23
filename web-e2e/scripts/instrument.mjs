#!/usr/bin/env node
/**
 * Istanbul 插桩脚本
 *
 * 功能：
 * 1. 用 NYC/Istanbul 对 h5App.js（必须）和 nativevue2.js（可选）进行插桩
 * 2. 将插桩后的文件输出到 instrumented/ 目录
 * 3. 同时复制 index.html（修改其中的 JS 路径以指向 instrumented 版本）
 *
 * 使用方法：
 *   node scripts/instrument.mjs                  # 仅插桩 h5App.js
 *   node scripts/instrument.mjs --with-native    # 同时插桩 nativevue2.js
 *   node scripts/instrument.mjs --skip-if-exists # 已存在则跳过
 *
 * 输出：
 *   instrumented/
 *     h5App.js          （插桩版本）
 *     h5App.js.map      （source map，供 NYC 反向映射）
 *     nativevue2.js     （可选，插桩版本）
 *     nativevue2.js.map （可选）
 *     index.html        （路径已调整）
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const e2eRoot = join(__dirname, '..');
const projectRoot = join(e2eRoot, '..');

// 源文件路径
const H5APP_BUILD_DIR = join(projectRoot, 'h5App', 'build', 'kotlin-webpack', 'js', 'developmentExecutable');
const NATIVE_BUILD_DIR = join(projectRoot, 'demo', 'build', 'dist', 'js', 'developmentExecutable');
const INDEX_HTML_SRC  = join(projectRoot, 'h5App', 'build', 'processedResources', 'js', 'main', 'index.html');

// 输出目录
const INSTRUMENTED_DIR = join(e2eRoot, 'instrumented');

// 解析参数
const args = process.argv.slice(2);
const withNative    = args.includes('--with-native');
const skipIfExists  = args.includes('--skip-if-exists');

function log(msg) { console.log(`[instrument] ${msg}`); }
function warn(msg) { console.warn(`[instrument] ⚠️  ${msg}`); }
function error(msg) { console.error(`[instrument] ❌ ${msg}`); }

/**
 * 对某目录下的所有 JS 文件进行 Istanbul 插桩
 * NYC instrument 以目录为单位工作，srcDir 中的文件会被插桩到 outDir 同名文件
 */
function instrumentDir(srcDir, outDir, label) {
  if (!existsSync(srcDir)) {
    warn(`Source directory not found, skipping [${label}]: ${srcDir}`);
    return false;
  }

  if (skipIfExists && existsSync(outDir)) {
    log(`Already instrumented (--skip-if-exists) [${label}]: ${outDir}`);
    return true;
  }

  log(`Instrumenting [${label}]:`);
  log(`  src → ${srcDir}`);
  log(`  out → ${outDir}`);

  // 计算相对于 projectRoot 的路径（NYC 要求在 project root 内）
  const relSrc = srcDir.replace(projectRoot + path.sep, '').replace(projectRoot + '/', '');
  const relOut = outDir.replace(projectRoot + path.sep, '').replace(projectRoot + '/', '');

  try {
    execSync(
      `npx nyc instrument --source-map=true "${relSrc}" "${relOut}"`,
      { cwd: projectRoot, stdio: 'inherit' }
    );
    log(`✅ Done [${label}]: ${outDir}`);
    return true;
  } catch (e) {
    error(`Failed to instrument [${label}]: ${e.message}`);
    return false;
  }
}

/**
 * 复制 source map 文件（NYC 需要 .js.map 来做反向映射）
 */
function copySourceMap(srcDir, filename) {
  const mapSrc = join(srcDir, `${filename}.map`);
  const mapDst = join(INSTRUMENTED_DIR, `${filename}.map`);
  if (existsSync(mapSrc)) {
    copyFileSync(mapSrc, mapDst);
    log(`Copied source map: ${mapDst}`);
  } else {
    warn(`Source map not found: ${mapSrc} (coverage will be JS-level only)`);
  }
}

/**
 * 复制并修改 index.html，使其加载 instrumented 版 nativevue2.js（本地）
 */
function patchIndexHtml() {
  if (!existsSync(INDEX_HTML_SRC)) {
    warn(`index.html not found: ${INDEX_HTML_SRC}`);
    return;
  }

  let html = readFileSync(INDEX_HTML_SRC, 'utf8');

  // 若插桩了 nativevue2.js，将外部 URL 替换为本地 /nativevue2.js
  if (withNative) {
    // 替换 http://127.0.0.1:8083/nativevue2.js → /nativevue2.js
    html = html.replace(
      /src="[^"]*nativevue2\.js"/g,
      'src="/nativevue2.js"'
    );
    log('Patched index.html: nativevue2.js → local /nativevue2.js');
  }
  // h5App.js 路径不变（仍然是 h5App.js，由服务器从 instrumented/ 提供）

  const destHtml = join(INSTRUMENTED_DIR, 'index.html');
  writeFileSync(destHtml, html, 'utf8');
  log(`Copied index.html → ${destHtml}`);
}

/**
 * 在 h5App.js 的 webpack UMD 包装函数前注入 istanbul ignore 注释。
 *
 * webpack 生成的 UMD 包装含有 CommonJS/AMD/全局变量三条分支，浏览器环境下
 * 只会走其中一条，其余分支天然不可达。通过 "/* istanbul ignore next *\/" 告知
 * Istanbul 跳过对该函数的分支插桩，避免拉低 branch 覆盖率。
 *
 * 操作：直接修改原始文件，函数返回原始内容（供调用方插桩后还原）。
 */
function patchUMDWrapper(srcDir) {
  const srcFile = join(srcDir, 'h5App.js');

  if (!existsSync(srcFile)) {
    warn(`h5App.js not found for patching: ${srcFile}`);
    return null;
  }

  const original = readFileSync(srcFile, 'utf8');

  // 精准忽略 webpack UMD 包装里天然不可达的分支，而非忽略整个文件。
  // 在浏览器环境下只有 else 分支（globalThis）会执行：
  //   if(typeof exports ...) → 不可达，加 /* istanbul ignore next */
  //   else if(typeof define ...) → 不可达，加 /* istanbul ignore next */
  //   else { ... } → 实际执行路径，不忽略
  const UMD_PATTERN = /(if\(typeof exports === 'object' && typeof module === 'object'\))([\s\S]*?)(else if\(typeof define === 'function' && define\.amd\))/;

  if (UMD_PATTERN.test(original)) {
    const patched = original.replace(
      UMD_PATTERN,
      '/* istanbul ignore next */ $1$2/* istanbul ignore next */ $3'
    );
    writeFileSync(srcFile, patched, 'utf8');
    log('Injected "istanbul ignore next" on unreachable UMD branches (CJS and AMD)');
  } else {
    log('UMD branches not found with expected pattern, skipping patch');
  }

  return original;
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

log('Starting Istanbul instrumentation...');
log(`Project root  : ${projectRoot}`);
log(`e2e root      : ${e2eRoot}`);
log(`With native   : ${withNative}`);

// 确保输出目录存在
mkdirSync(INSTRUMENTED_DIR, { recursive: true });
log(`Output dir    : ${INSTRUMENTED_DIR}`);

// 1. 插桩 h5App.js 所在目录（必须）
// patch 原始文件 → 插桩 → 还原原始文件（不留副作用）
const originalH5App = patchUMDWrapper(H5APP_BUILD_DIR);
const h5AppSrcDir = H5APP_BUILD_DIR;
const h5AppOutDir = join(INSTRUMENTED_DIR, 'h5app-src');
const h5AppOk     = instrumentDir(h5AppSrcDir, h5AppOutDir, 'h5App');

// 插桩完成后立即还原原始文件
if (originalH5App !== null) {
  writeFileSync(join(H5APP_BUILD_DIR, 'h5App.js'), originalH5App, 'utf8');
  log('Restored original h5App.js');
}

// 将 h5App.js 从子目录平铺到 instrumented/ 根（服务器从根提供）
if (h5AppOk) {
  const srcJs  = join(h5AppOutDir, 'h5App.js');
  const destJs = join(INSTRUMENTED_DIR, 'h5App.js');
  if (existsSync(srcJs)) {
    copyFileSync(srcJs, destJs);
    log(`Promoted h5App.js → instrumented/h5App.js`);
  }
  copySourceMap(H5APP_BUILD_DIR, 'h5App.js');
}

// 2. 插桩 nativevue2.js（可选）
if (withNative) {
  const nativeSrcDir = NATIVE_BUILD_DIR;
  const nativeOutDir = join(INSTRUMENTED_DIR, 'native-src');
  const nativeOk     = instrumentDir(nativeSrcDir, nativeOutDir, 'nativevue2');
  if (nativeOk) {
    const srcJs  = join(nativeOutDir, 'nativevue2.js');
    const destJs = join(INSTRUMENTED_DIR, 'nativevue2.js');
    if (existsSync(srcJs)) {
      copyFileSync(srcJs, destJs);
      log(`Promoted nativevue2.js → instrumented/nativevue2.js`);
    }
    copySourceMap(NATIVE_BUILD_DIR, 'nativevue2.js');
  }
} else {
  log('Skipping nativevue2.js (use --with-native to include)');
}

// 3. 处理 index.html
patchIndexHtml();

log('\n✅ Instrumentation complete!');
log(`Instrumented files in: ${INSTRUMENTED_DIR}`);
log('\nNext step: start instrumented server with:');
log('  npm run serve:instrumented');
