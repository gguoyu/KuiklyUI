#!/usr/bin/env node

/**
 * Kuikly Web E2E 测试本地服务脚本
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const BUILD_TYPE = process.env.BUILD_TYPE || 'productionExecutable';
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const E2E_ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, 'h5App', 'build', 'processedResources', 'js', 'main');
const DIST_DIR = path.join(PROJECT_ROOT, 'demo', 'build', 'dist', 'js', BUILD_TYPE);
const DIST_DEV_DIR = path.join(PROJECT_ROOT, 'demo', 'build', 'dist', 'js', 'developmentExecutable');
const WEBPACK_DIR = path.join(PROJECT_ROOT, 'h5App', 'build', 'kotlin-webpack', 'js', 'developmentExecutable');
const WHISTLE_DIR = path.join(PROJECT_ROOT, 'node_modules', 'whistle', 'biz', 'webui', 'htdocs');
const FONTS_DIR = path.join(E2E_ROOT, 'fonts');

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
  '.pag': 'application/octet-stream',
  '.woff2': 'font/woff2',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function buildFontInjection() {
  const fontFile = path.join(FONTS_DIR, 'NotoSansSC-Regular.woff2');
  if (!fs.existsSync(fontFile)) {
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

function findFile(requestPath) {
  if (requestPath === '/' || requestPath === '') {
    const indexPath = path.join(BUILD_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  const cleanPath = requestPath.replace(/^\//, '');

  if (cleanPath.startsWith('fonts/')) {
    const fontPath = path.join(FONTS_DIR, cleanPath.slice('fonts/'.length));
    if (fs.existsSync(fontPath) && fs.statSync(fontPath).isFile()) {
      return fontPath;
    }
    return null;
  }

  const buildPath = path.join(BUILD_DIR, cleanPath);
  if (fs.existsSync(buildPath) && fs.statSync(buildPath).isFile()) {
    return buildPath;
  }

  const distPath = path.join(DIST_DIR, cleanPath);
  if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
    return distPath;
  }

  const distDevPath = path.join(DIST_DEV_DIR, cleanPath);
  if (fs.existsSync(distDevPath) && fs.statSync(distDevPath).isFile()) {
    return distDevPath;
  }

  const webpackPath = path.join(WEBPACK_DIR, cleanPath);
  if (fs.existsSync(webpackPath) && fs.statSync(webpackPath).isFile()) {
    return webpackPath;
  }

  const whistlePath = path.join(WHISTLE_DIR, cleanPath);
  if (fs.existsSync(whistlePath) && fs.statSync(whistlePath).isFile()) {
    return whistlePath;
  }

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

const server = http.createServer((req, res) => {
  const requestPath = req.url.split('?')[0];

  if (requestPath.startsWith('/api/network/')) {
    if (handleNetworkMock(req, res, requestPath)) {
      return;
    }
  }

  const filePath = findFile(requestPath);

  if (filePath) {
    try {
      let content = fs.readFileSync(filePath);
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

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(content);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Internal Server Error: ${error.message}`);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>404 Not Found</title></head>
        <body>
          <h1>404 - File Not Found</h1>
          <p>Path: ${requestPath}</p>
          <p>Searched in:</p>
          <ul>
            <li>${BUILD_DIR}</li>
            <li>${DIST_DIR}</li>
          </ul>
        </body>
      </html>
    `);
  }
});

server.listen(PORT, () => {
  console.log(`Kuikly test server listening on http://localhost:${PORT}/`);
});

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
