#!/usr/bin/env node
/**
 * 插桩版本测试服务器
 *
 * 与 serve.js 的区别：
 * - 优先从 instrumented/ 目录提供文件（插桩版 h5App.js / nativevue2.js）
 * - 新增 /modules/* 路由：提供 instrumented/modules/ 下的插桩 Kotlin 模块文件
 * - 新增 /kotlin-modules/* 路由：提供 compileSync 目录下的原版运行时模块（stdlib 等）
 * - 若 instrumented/ 中无对应文件，回退到原始 BUILD_DIR
 *
 * 使用方法：
 *   npm run serve:instrumented            # 默认端口 8080
 *   PORT=8081 npm run serve:instrumented  # 自定义端口
 */

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT           = process.env.PORT || 8080;
const PROJECT_ROOT   = join(__dirname, '..', '..');
const E2E_ROOT       = join(__dirname, '..');

// 目录映射
const INSTRUMENTED_DIR  = join(E2E_ROOT, 'instrumented');
const MODULES_DIR       = join(INSTRUMENTED_DIR, 'modules');        // 插桩版 Kotlin 模块
const KOTLIN_MODULES_DIR = join(                                     // 原版运行时模块（stdlib 等）
  PROJECT_ROOT, 'h5App', 'build', 'compileSync', 'js', 'main', 'developmentExecutable', 'kotlin'
);
const BUILD_DIR         = join(PROJECT_ROOT, 'h5App', 'build', 'processedResources', 'js', 'main');
const NATIVE_DIST_DIR   = join(PROJECT_ROOT, 'demo', 'build', 'dist', 'js', 'developmentExecutable');
const FONTS_DIR         = join(E2E_ROOT, 'fonts');

const MIME_TYPES = {
  '.html':  'text/html',
  '.js':    'application/javascript',
  '.json':  'application/json',
  '.css':   'text/css',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.webp':  'image/webp',
  '.wasm':  'application/wasm',
  '.map':   'application/json',
  '.woff2': 'font/woff2',
};

function getMimeType(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

/**
 * 生成 Web Font 注入 CSS。
 * 若 fonts/NotoSansSC-Regular.woff2 不存在则返回空字符串（静默降级）。
 */
function buildFontInjection() {
  const fontFile = join(FONTS_DIR, 'NotoSansSC-Regular.woff2');
  if (!existsSync(fontFile)) {
    return '';
  }
  return `<style>
  @font-face {
    font-family: 'KuiklyTestFont';
    src: url('/fonts/NotoSansSC-Regular.woff2') format('woff2');
    font-display: block;
  }
  * { font-family: 'KuiklyTestFont', sans-serif !important; }
</style>`;
}

function isFile(p) { return existsSync(p) && statSync(p).isFile(); }

function findFile(requestPath) {
  if (requestPath === '/' || requestPath === '') {
    const ii = join(INSTRUMENTED_DIR, 'index.html');
    if (isFile(ii)) return ii;
    const bi = join(BUILD_DIR, 'index.html');
    if (isFile(bi)) return bi;
    return null;
  }

  const clean = requestPath.replace(/^\//, '');

  // /fonts/* — Web Font 文件
  if (clean.startsWith('fonts/')) {
    const fontPath = join(FONTS_DIR, clean.slice('fonts/'.length));
    if (isFile(fontPath)) return fontPath;
    return null;
  }

  // /modules/* — 插桩版 Kotlin 模块文件（Istanbul 已注入计数器）
  if (clean.startsWith('modules/')) {
    const modPath = join(MODULES_DIR, clean.slice('modules/'.length));
    if (isFile(modPath)) return modPath;
    return null;
  }

  // /kotlin-modules/* — 原版运行时模块（kotlin-stdlib 等，不插桩）
  if (clean.startsWith('kotlin-modules/')) {
    const modPath = join(KOTLIN_MODULES_DIR, clean.slice('kotlin-modules/'.length));
    if (isFile(modPath)) return modPath;
    return null;
  }

  // instrumented/ 目录优先（h5App.js loader、nativevue2.js、source maps）
  const ip = join(INSTRUMENTED_DIR, clean);
  if (isFile(ip)) return ip;

  // h5App 构建产物（index.html、assets 等）
  const bp = join(BUILD_DIR, clean);
  if (isFile(bp)) return bp;

  // nativevue2.js 来自 demo build
  const np = join(NATIVE_DIST_DIR, clean);
  if (isFile(np)) return np;

  // composeResources
  const cp = join(NATIVE_DIST_DIR, 'composeResources', clean);
  if (isFile(cp)) return cp;

  return null;
}

const server = createServer((req, res) => {
  const requestPath = req.url.split('?')[0];
  const filePath    = findFile(requestPath);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (!filePath) {
    console.log(`❌ 404: ${requestPath}`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  try {
    let content  = readFileSync(filePath);
    const mimeType = getMimeType(filePath);

    // 如果是 index.html，重写 nativevue2.js 远程 URL，并注入 Web Font CSS
    if (filePath.endsWith('index.html')) {
      let html = content.toString('utf-8');
      html = html.replace(
        /src="http:\/\/127\.0\.0\.1:8083\/nativevue2\.js"/g,
        'src="nativevue2.js"'
      );
      const fontInjection = buildFontInjection();
      if (fontInjection) {
        html = html.replace('</head>', `${fontInjection}\n</head>`);
      }
      content = Buffer.from(html, 'utf-8');
    }

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
    console.log(`✅ ${requestPath} → ${filePath.replace(PROJECT_ROOT, '')}`);
  } catch (e) {
    console.error(`❌ Error: ${filePath}`, e);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
  }
});

server.listen(PORT, () => {
  const hasLoader  = isFile(join(INSTRUMENTED_DIR, 'h5App.js'));
  const hasModules = isFile(join(MODULES_DIR, 'KuiklyCore-render-web-base.js'));
  console.log('\n🔬 Kuikly 插桩测试服务器已启动 (Coverage Mode)\n');
  console.log(`   端口            : ${PORT}`);
  console.log(`   访问地址        : http://localhost:${PORT}/`);
  console.log(`   插桩目录        : ${INSTRUMENTED_DIR}`);
  console.log(`   h5App.js loader : ${hasLoader  ? '✅' : '❌ (需先运行 npm run instrument)'}`);
  console.log(`   插桩模块        : ${hasModules ? '✅ modules/' : '❌ (需先运行 npm run instrument)'}`);
  console.log('\n按 Ctrl+C 停止服务器\n');
});

process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务器...');
  server.close(() => { console.log('✅ 已关闭'); process.exit(0); });
});

