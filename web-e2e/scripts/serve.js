#!/usr/bin/env node

/**
 * Kuikly Web E2E 测试本地服务脚本
 */

const http = require('http');
const path = require('path');
const { build, runtime } = require('../config/index.cjs');
const { findFirstFile, handleNetworkMock, sendFile } = require('./serve-common.cjs');

const PORT = runtime.resolvePort();
const BUILD_TYPE = process.env.BUILD_TYPE || build.defaultBuildType;
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const E2E_ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, build.processedResourcesDir);
const DIST_DIR = path.join(PROJECT_ROOT, build.demoDistBaseDir, BUILD_TYPE);
const DIST_DEV_DIR = path.join(PROJECT_ROOT, build.demoDistBaseDir, build.developmentDistSubdir);
const WEBPACK_DIR = path.join(PROJECT_ROOT, build.kotlinWebpackDir);
const WHISTLE_DIR = path.join(PROJECT_ROOT, build.whistleHtdocsDir);
const FONTS_DIR = path.join(E2E_ROOT, build.fontsDirName);

function findFile(requestPath) {
  if (requestPath === '/' || requestPath === '') {
    return findFirstFile([path.join(BUILD_DIR, 'index.html')]);
  }

  const cleanPath = requestPath.replace(/^\//, '');

  if (cleanPath.startsWith('fonts/')) {
    return findFirstFile([path.join(FONTS_DIR, cleanPath.slice('fonts/'.length))]);
  }

  return findFirstFile([
    path.join(BUILD_DIR, cleanPath),
    path.join(DIST_DIR, cleanPath),
    path.join(DIST_DEV_DIR, cleanPath),
    path.join(WEBPACK_DIR, cleanPath),
    path.join(WHISTLE_DIR, cleanPath),
  ]);
}

const server = http.createServer((req, res) => {
  const requestPath = (req.url || '/').split('?')[0];

  if (requestPath.startsWith('/api/network/') && handleNetworkMock(req, res, requestPath, PORT)) {
    return;
  }

  const filePath = findFile(requestPath);
  if (!filePath) {
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
    return;
  }

  try {
    sendFile(res, filePath, FONTS_DIR);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Internal Server Error: ${error.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`Kuikly test server listening on http://localhost:${PORT}/`);
});

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
