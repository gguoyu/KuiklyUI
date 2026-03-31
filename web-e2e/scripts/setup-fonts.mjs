#!/usr/bin/env node
/**
 * 字体下载脚本
 *
 * 从 Google Fonts CDN 下载 Noto Sans SC 子集字体（Latin + 常用中文），
 * 保存到 web-e2e/fonts/NotoSansSC-Regular.woff2。
 *
 * 字体用于 serve.js 注入到测试页面，使文字渲染与系统字体解耦，
 * 消除跨平台字体渲染差异，提升截图一致性。
 *
 * 使用方法：
 *   npm run setup       # 安装字体（首次使用或字体文件丢失时执行）
 *   node scripts/setup-fonts.mjs
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { get as httpsGet } from 'https';
import { get as httpGet } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const E2E_ROOT  = join(__dirname, '..');
const FONTS_DIR = join(E2E_ROOT, 'fonts');
const FONT_FILE = join(FONTS_DIR, 'NotoSansSC-Regular.woff2');

// Google Fonts CSS2 API — 请求 Noto Sans SC Regular，仅包含 Latin 和常用中文子集
// display=block 确保字体加载期间不会出现 FOUT（Flash of Unstyled Text）
const GOOGLE_FONTS_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400&display=block&subset=latin,chinese-simplified';

// User-Agent 模拟现代 Chrome，使 Google Fonts 返回 WOFF2 格式
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 发起 HTTP/HTTPS GET 请求，返回响应体字符串。
 * 支持 30x 重定向（最多 5 次）。
 */
function fetchText(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('重定向次数过多'));
      return;
    }
    const lib   = url.startsWith('https://') ? httpsGet : httpGet;
    const req   = lib(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchText(res.headers.location, redirectCount + 1));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end',  ()    => resolve(data));
    });
    req.on('error', reject);
  });
}

/**
 * 发起 HTTPS GET 请求，将响应体写入文件。
 * 支持 30x 重定向。
 */
function downloadBinary(url, destPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('重定向次数过多'));
      return;
    }
    const lib = url.startsWith('https://') ? httpsGet : httpGet;
    const req = lib(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(downloadBinary(res.headers.location, destPath, redirectCount + 1));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      const fileStream = createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
    req.on('error', reject);
  });
}

/**
 * 从 Google Fonts CSS 响应中提取第一个 WOFF2 直链 URL。
 * CSS 格式示例：
 *   src: url(https://fonts.gstatic.com/s/.../xxx.woff2) format('woff2');
 */
function extractWoff2Url(css) {
  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
  return match ? match[1] : null;
}

async function main() {
  // 检查字体文件是否已存在
  if (existsSync(FONT_FILE)) {
    console.log(`✅ 字体文件已存在，跳过下载：${FONT_FILE}`);
    return;
  }

  // 确保 fonts/ 目录存在
  if (!existsSync(FONTS_DIR)) {
    mkdirSync(FONTS_DIR, { recursive: true });
    console.log(`📁 已创建目录：${FONTS_DIR}`);
  }

  console.log('⬇️  正在从 Google Fonts 获取字体信息...');
  console.log(`   URL: ${GOOGLE_FONTS_CSS_URL}`);

  let css;
  try {
    css = await fetchText(GOOGLE_FONTS_CSS_URL);
  } catch (err) {
    console.error(`\n❌ 获取 Google Fonts CSS 失败：${err.message}`);
    console.error('   请检查网络连接，或手动下载字体文件：');
    console.error(`   目标路径：${FONT_FILE}`);
    console.error('   字体来源：https://fonts.google.com/noto/specimen/Noto+Sans+SC');
    process.exit(1);
  }

  const woff2Url = extractWoff2Url(css);
  if (!woff2Url) {
    console.error('\n❌ 无法从 CSS 响应中解析 WOFF2 URL。');
    console.error('   CSS 响应片段（前 500 字符）：');
    console.error('   ' + css.slice(0, 500));
    process.exit(1);
  }

  console.log(`\n⬇️  正在下载字体文件...`);
  console.log(`   URL: ${woff2Url}`);
  console.log(`   目标: ${FONT_FILE}`);

  try {
    await downloadBinary(woff2Url, FONT_FILE);
  } catch (err) {
    console.error(`\n❌ 字体下载失败：${err.message}`);
    // 清理可能创建的不完整文件
    if (existsSync(FONT_FILE)) {
      try { require('fs').unlinkSync(FONT_FILE); } catch (_) {}
    }
    process.exit(1);
  }

  console.log('\n✅ 字体下载完成！');
  console.log(`   文件路径：${FONT_FILE}`);
  console.log('\n🚀 现在可以运行测试了：');
  console.log('   node scripts/kuikly-test.mjs --full  # 标准入口：本地一键完整闭环');
  console.log('   npm run test:smoke                   # 本地调试时快速冒烟');
}

main().catch(err => {
  console.error('❌ 未预期错误：', err);
  process.exit(1);
});
