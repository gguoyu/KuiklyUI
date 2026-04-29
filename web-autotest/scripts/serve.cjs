#!/usr/bin/env node

/**
 * Kuikly Web E2E 测试本地服务脚本
 */

const http = require('http');
const path = require('path');
const { existsSync, readdirSync, statSync } = require('fs');
const { build, coverage, runtime } = require('../config/index.cjs');
const { findFirstFile, handleNetworkMock, sendFile } = require('./serve-common.cjs');

const PORT = runtime.resolvePort();
const BUILD_TYPE = process.env.BUILD_TYPE || build.defaultBuildType;
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const E2E_ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, build.processedResourcesDir);
const DIST_DIR = path.join(PROJECT_ROOT, build.demoDistBaseDir, BUILD_TYPE);
const DIST_DEV_DIR = path.join(PROJECT_ROOT, build.demoDistBaseDir, build.developmentDistSubdir);
const WEBPACK_DIR = path.join(PROJECT_ROOT, build.kotlinWebpackDir);
const KOTLIN_MODULES_DIR = path.join(PROJECT_ROOT, build.kotlinModulesDir);
const WHISTLE_DIR = path.join(PROJECT_ROOT, build.whistleHtdocsDir);
const FONTS_DIR = path.join(E2E_ROOT, build.fontsDirName);
const TARGET_MODULES = coverage.targetModules;

function isFile(filePath) {
  return existsSync(filePath) && statSync(filePath).isFile();
}

function listKotlinModules() {
  if (!existsSync(KOTLIN_MODULES_DIR)) {
    return [];
  }

  return readdirSync(KOTLIN_MODULES_DIR)
    .filter((fileName) => fileName.endsWith('.js') && !fileName.endsWith('.map'))
    .sort();
}

function createKotlinModulesLoader() {
  const allModules = listKotlinModules();
  if (!allModules.length) {
    return null;
  }

  const nonTargetModules = allModules.filter((moduleName) => !TARGET_MODULES.includes(moduleName));
  const orderedTargetModules = TARGET_MODULES.filter((moduleName) => allModules.includes(moduleName));
  const orderedModules = [...nonTargetModules, ...orderedTargetModules];
  const moduleList = orderedModules
    .map((moduleName) => `    '/kotlin-modules/${moduleName}'`)
    .join(',\n');

  return `(function () {
  'use strict';

  var MODULES = [
${moduleList}
  ];
  var index = 0;

  function loadNext() {
    if (index >= MODULES.length) {
      return;
    }

    var script = document.createElement('script');
    script.src = MODULES[index++];
    script.onload = loadNext;
    script.onerror = function () {
      console.error('[kuikly-loader] Failed to load: ' + script.src);
    };
    document.head.appendChild(script);
  }

  loadNext();
})();\n`;
}

function sendSyntheticLoader(res) {
  const loader = createKotlinModulesLoader();
  if (!loader) {
    return false;
  }

  res.writeHead(200, {
    'Content-Type': 'application/javascript',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(loader);
  return true;
}

function findStaticFile(cleanPath) {
  if (!cleanPath) {
    return findFirstFile([path.join(BUILD_DIR, 'index.html')]);
  }

  if (cleanPath.startsWith('fonts/')) {
    return findFirstFile([path.join(FONTS_DIR, cleanPath.slice('fonts/'.length))]);
  }

  if (cleanPath.startsWith('kotlin-modules/')) {
    return findFirstFile([path.join(KOTLIN_MODULES_DIR, cleanPath.slice('kotlin-modules/'.length))]);
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
  const cleanPath = requestPath === '/' ? '' : requestPath.replace(/^\//, '');

  if (requestPath.startsWith('/api/network/') && handleNetworkMock(req, res, requestPath, PORT)) {
    return;
  }

  const filePath = findStaticFile(cleanPath);
  if (!filePath && cleanPath === 'h5App.js' && sendSyntheticLoader(res)) {
    return;
  }

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
            <li>${DIST_DEV_DIR}</li>
            <li>${WEBPACK_DIR}</li>
            <li>${KOTLIN_MODULES_DIR}</li>
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
