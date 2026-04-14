#!/usr/bin/env node
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import webE2EConfig from '../config/index.cjs';

const require = createRequire(import.meta.url);
const { applyCorsHeaders, findFirstFile, handleNetworkMock, sendFile } = require('./serve-common.cjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { build, coverage, runtime } = webE2EConfig;

const PORT = runtime.resolvePort();
const PROJECT_ROOT = join(__dirname, '..', '..');
const E2E_ROOT = join(__dirname, '..');
const INSTRUMENTED_DIR = join(E2E_ROOT, build.instrumentedDirName);
const MODULES_DIR = join(INSTRUMENTED_DIR, build.instrumentedModulesDirName);
const KOTLIN_MODULES_DIR = join(PROJECT_ROOT, coverage.generatedKotlinOutputDir);
const BUILD_DIR = join(PROJECT_ROOT, build.processedResourcesDir);
const NATIVE_DIST_DIR = join(PROJECT_ROOT, build.demoDistBaseDir, build.developmentDistSubdir);
const FONTS_DIR = join(E2E_ROOT, build.fontsDirName);

function findFile(requestPath) {
  if (requestPath === '/' || requestPath === '') {
    return findFirstFile([
      join(INSTRUMENTED_DIR, 'index.html'),
      join(BUILD_DIR, 'index.html'),
    ]);
  }

  const cleanPath = requestPath.replace(/^\//, '');

  if (cleanPath.startsWith('fonts/')) {
    return findFirstFile([join(FONTS_DIR, cleanPath.slice('fonts/'.length))]);
  }

  if (cleanPath.startsWith('modules/')) {
    return findFirstFile([join(MODULES_DIR, cleanPath.slice('modules/'.length))]);
  }

  if (cleanPath.startsWith('kotlin-modules/')) {
    return findFirstFile([join(KOTLIN_MODULES_DIR, cleanPath.slice('kotlin-modules/'.length))]);
  }

  return findFirstFile([
    join(INSTRUMENTED_DIR, cleanPath),
    join(BUILD_DIR, cleanPath),
    join(NATIVE_DIST_DIR, cleanPath),
    join(NATIVE_DIST_DIR, build.composeResourcesDirName, cleanPath),
  ]);
}

const server = createServer((req, res) => {
  const requestPath = (req.url || '/').split('?')[0];

  applyCorsHeaders(res, true);
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (requestPath.startsWith('/api/network/') && handleNetworkMock(req, res, requestPath, PORT)) {
    return;
  }

  const filePath = findFile(requestPath);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  try {
    sendFile(res, filePath, FONTS_DIR);
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
