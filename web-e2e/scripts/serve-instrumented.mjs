#!/usr/bin/env node
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8080;
const PROJECT_ROOT = join(__dirname, '..', '..');
const E2E_ROOT = join(__dirname, '..');
const INSTRUMENTED_DIR = join(E2E_ROOT, 'instrumented');
const MODULES_DIR = join(INSTRUMENTED_DIR, 'modules');
const KOTLIN_MODULES_DIR = join(
  PROJECT_ROOT,
  'h5App',
  'build',
  'compileSync',
  'js',
  'main',
  'developmentExecutable',
  'kotlin'
);
const BUILD_DIR = join(PROJECT_ROOT, 'h5App', 'build', 'processedResources', 'js', 'main');
const NATIVE_DIST_DIR = join(PROJECT_ROOT, 'demo', 'build', 'dist', 'js', 'developmentExecutable');
const FONTS_DIR = join(E2E_ROOT, 'fonts');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.woff2': 'font/woff2',
};

function getMimeType(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

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

function isFile(p) {
  return existsSync(p) && statSync(p).isFile();
}

function findFile(requestPath) {
  if (requestPath === '/' || requestPath === '') {
    const ii = join(INSTRUMENTED_DIR, 'index.html');
    if (isFile(ii)) return ii;
    const bi = join(BUILD_DIR, 'index.html');
    if (isFile(bi)) return bi;
    return null;
  }

  const clean = requestPath.replace(/^\//, '');

  if (clean.startsWith('fonts/')) {
    const fontPath = join(FONTS_DIR, clean.slice('fonts/'.length));
    if (isFile(fontPath)) return fontPath;
    return null;
  }

  if (clean.startsWith('modules/')) {
    const modPath = join(MODULES_DIR, clean.slice('modules/'.length));
    if (isFile(modPath)) return modPath;
    return null;
  }

  if (clean.startsWith('kotlin-modules/')) {
    const modPath = join(KOTLIN_MODULES_DIR, clean.slice('kotlin-modules/'.length));
    if (isFile(modPath)) return modPath;
    return null;
  }

  const ip = join(INSTRUMENTED_DIR, clean);
  if (isFile(ip)) return ip;

  const bp = join(BUILD_DIR, clean);
  if (isFile(bp)) return bp;

  const np = join(NATIVE_DIST_DIR, clean);
  if (isFile(np)) return np;

  const cp = join(NATIVE_DIST_DIR, 'composeResources', clean);
  if (isFile(cp)) return cp;

  return null;
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function handleNetworkMock(req, res, requestPath) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (requestPath === '/api/network/get') {
    sendJson(res, 200, {
      success: true,
      url: `http://localhost:${PORT}/api/network/get?key=${url.searchParams.get('key')}`,
      query: { key: url.searchParams.get('key') },
    });
    return true;
  }

  if (requestPath === '/api/network/get-binary') {
    sendText(res, 405, 'GET binary mock only supports status validation');
    return true;
  }

  if (requestPath === '/api/network/post') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      sendJson(res, 200, {
        success: true,
        url: `http://localhost:${PORT}/api/network/post`,
        json: body ? JSON.parse(body) : {},
      });
    });
    return true;
  }

  if (requestPath === '/api/network/post-binary') {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(Buffer.concat(chunks));
    });
    return true;
  }

  if (requestPath === '/api/network/status/204') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
    });
    res.end();
    return true;
  }

  return false;
}

const server = createServer((req, res) => {
  const requestPath = req.url.split('?')[0];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (requestPath.startsWith('/api/network/')) {
    if (handleNetworkMock(req, res, requestPath)) {
      return;
    }
  }

  const filePath = findFile(requestPath);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  try {
    let content = readFileSync(filePath);
    const mimeType = getMimeType(filePath);

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
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Instrumented Kuikly test server listening on http://localhost:${PORT}/`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
