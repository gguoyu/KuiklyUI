#!/usr/bin/env node

/**
 * Kuikly Web E2E 测试本地服务器脚本
 * 
 * 功能：
 * 1. 启动本地 HTTP 服务器，服务 h5App 的构建产物
 * 2. 支持配置端口、构建类型（development/production）
 * 
 * 使用方法：
 *   npm run serve           # 启动生产环境服务器（端口 8080）
 *   npm run serve:dev       # 启动开发环境服务器（端口 8080）
 */

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const PORT = process.env.PORT || 8080;
const BUILD_TYPE = process.env.BUILD_TYPE || 'productionExecutable'; // 或 'developmentExecutable'
const PROJECT_ROOT = join(__dirname, '..', '..');
const BUILD_DIR = join(PROJECT_ROOT, 'h5App', 'build', 'processedResources', 'js', 'main');
const DIST_DIR = join(PROJECT_ROOT, 'demo', 'build', 'dist', 'js', BUILD_TYPE);

// MIME 类型映射
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
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function findFile(requestPath) {
  // 如果是根路径，返回 index.html
  if (requestPath === '/' || requestPath === '') {
    const indexPath = join(BUILD_DIR, 'index.html');
    if (existsSync(indexPath)) {
      return indexPath;
    }
  }

  // 清理路径
  const cleanPath = requestPath.replace(/^\//, '');

  // 尝试在 BUILD_DIR 中查找
  const buildPath = join(BUILD_DIR, cleanPath);
  if (existsSync(buildPath) && statSync(buildPath).isFile()) {
    return buildPath;
  }

  // 尝试在 DIST_DIR 中查找
  const distPath = join(DIST_DIR, cleanPath);
  if (existsSync(distPath) && statSync(distPath).isFile()) {
    return distPath;
  }

  // 特殊处理：composeResources 目录
  const resourcesPath = join(DIST_DIR, 'composeResources', cleanPath);
  if (existsSync(resourcesPath) && statSync(resourcesPath).isFile()) {
    return resourcesPath;
  }

  return null;
}

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  const requestPath = req.url.split('?')[0]; // 移除查询参数
  const filePath = findFile(requestPath);

  // 添加 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (!filePath) {
    console.log(`❌ 404 Not Found: ${requestPath}`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  try {
    const content = readFileSync(filePath);
    const mimeType = getMimeType(filePath);

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);

    console.log(`✅ 200 OK: ${requestPath} -> ${filePath}`);
  } catch (error) {
    console.error(`❌ Error reading file: ${filePath}`, error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log('\n🚀 Kuikly Web E2E 测试服务器已启动\n');
  console.log(`   构建类型: ${BUILD_TYPE}`);
  console.log(`   端口: ${PORT}`);
  console.log(`   访问地址: http://localhost:${PORT}/`);
  console.log(`   BUILD_DIR: ${BUILD_DIR}`);
  console.log(`   DIST_DIR: ${DIST_DIR}`);
  console.log('\n按 Ctrl+C 停止服务器\n');
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n👋 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
