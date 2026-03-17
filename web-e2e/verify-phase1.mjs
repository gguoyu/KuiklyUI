#!/usr/bin/env node

/**
 * Phase 1 自动化验证脚本
 * 
 * 验证内容：
 * 1. 检查文件结构完整性
 * 2. 检查渲染层代码改动
 * 3. 检查 h5App 构建产物
 * 4. 验证 package.json 配置
 * 5. 提供下一步操作指引
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// 颜色输出辅助函数
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(title) {
  console.log();
  log(`${'='.repeat(60)}`, 'blue');
  log(`  ${title}`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');
}

// 验证计数器
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(description, testFn) {
  totalChecks++;
  try {
    const result = testFn();
    if (result === false) {
      error(description);
      failedChecks++;
      return false;
    }
    success(description);
    passedChecks++;
    return true;
  } catch (e) {
    error(`${description} - ${e.message}`);
    failedChecks++;
    return false;
  }
}

// ==================== 验证函数 ====================

/**
 * 1. 验证文件结构
 */
function verifyFileStructure() {
  section('1. 验证文件结构');

  const requiredFiles = [
    // 配置文件
    'web-e2e/package.json',
    'web-e2e/playwright.config.ts',
    'web-e2e/tsconfig.json',
    'web-e2e/.gitignore',
    
    // Fixtures
    'web-e2e/fixtures/kuikly-page.ts',
    'web-e2e/fixtures/test-base.ts',
    
    // 测试用例
    'web-e2e/tests/L0-static/smoke.spec.ts',
    
    // 脚本
    'web-e2e/scripts/serve.mjs',
    
    // 文档
    'web-e2e/README.md',
    'web-e2e/QUICKSTART.md',
    'web-e2e/VERIFICATION-CHECKLIST.md',
    'web-e2e/PHASE1-SUMMARY.md',
  ];

  requiredFiles.forEach(filePath => {
    const fullPath = join(PROJECT_ROOT, filePath);
    check(`${filePath} 存在`, () => existsSync(fullPath));
  });
}

/**
 * 2. 验证渲染层改动
 */
function verifyRenderLayerChanges() {
  section('2. 验证渲染层改动');

  const filePath = join(
    PROJECT_ROOT,
    'core-render-web/base/src/jsMain/kotlin/com/tencent/kuikly/core/render/web/layer/KuiklyRenderLayerHandler.kt'
  );

  check('KuiklyRenderLayerHandler.kt 文件存在', () => existsSync(filePath));

  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8');
    check(
      '已注入 data-kuikly-component 属性',
      () => content.includes('setAttribute("data-kuikly-component"')
    );
    check(
      '属性注入位置正确（第 373 行附近）',
      () => {
        const lines = content.split('\n');
        const targetLine = lines.findIndex(line => 
          line.includes('setAttribute("data-kuikly-component"')
        );
        return targetLine >= 370 && targetLine <= 380;
      }
    );
  }
}

/**
 * 3. 验证 h5App 构建产物
 */
function verifyBuildArtifacts() {
  section('3. 验证 h5App 构建产物');

  const buildDir = join(PROJECT_ROOT, 'h5App/build/processedResources/js/main');
  const indexHtml = join(buildDir, 'index.html');

  check('h5App/build 目录存在', () => existsSync(buildDir));
  
  const hasIndexHtml = check('index.html 存在', () => existsSync(indexHtml));
  
  if (!hasIndexHtml) {
    warn('h5App 尚未构建，需要运行: ./gradlew :h5App:jsBrowserProductionWebpack');
  }
}

/**
 * 4. 验证 package.json 配置
 */
function verifyPackageJson() {
  section('4. 验证 package.json 配置');

  const packageJsonPath = join(PROJECT_ROOT, 'web-e2e/package.json');
  
  if (!existsSync(packageJsonPath)) {
    error('package.json 不存在');
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  check('scripts.serve 脚本存在', () => !!packageJson.scripts?.serve);
  check('scripts.test:smoke 脚本存在', () => !!packageJson.scripts?.['test:smoke']);
  check('scripts.test:L0 脚本存在', () => !!packageJson.scripts?.['test:L0']);
  check('devDependencies 包含 @playwright/test', () => 
    !!packageJson.devDependencies?.['@playwright/test']
  );
}

/**
 * 5. 验证 node_modules 和 Playwright 安装状态
 */
function verifyDependencies() {
  section('5. 验证依赖安装状态');

  const nodeModulesPath = join(PROJECT_ROOT, 'web-e2e/node_modules');
  const playwrightPath = join(nodeModulesPath, '@playwright/test');

  const hasNodeModules = check('node_modules 目录存在', () => 
    existsSync(nodeModulesPath)
  );

  if (hasNodeModules) {
    check('@playwright/test 已安装', () => existsSync(playwrightPath));
  } else {
    warn('node_modules 未安装，需要运行: cd web-e2e && npm install');
  }
}

/**
 * 6. 检查 AUTOTEST.md 更新状态
 */
function verifyAutotestMd() {
  section('6. 验证 AUTOTEST.md 更新');

  const autotestPath = join(PROJECT_ROOT, 'AUTOTEST.md');
  
  if (!existsSync(autotestPath)) {
    error('AUTOTEST.md 不存在');
    return;
  }

  const content = readFileSync(autotestPath, 'utf-8');
  
  check('Phase 1 标记为已完成', () => 
    content.includes('Phase 1：基础设施搭建 ✅') || 
    content.includes('Phase 1') && content.includes('已完成')
  );
}

// ==================== 主程序 ====================

async function main() {
  log('\n🚀 Kuikly Web E2E - Phase 1 自动化验证', 'cyan');
  log('正在检查 Phase 1 实施成果...\n', 'cyan');

  // 执行所有验证
  verifyFileStructure();
  verifyRenderLayerChanges();
  verifyBuildArtifacts();
  verifyPackageJson();
  verifyDependencies();
  verifyAutotestMd();

  // 输出总结
  section('验证总结');
  console.log();
  log(`总检查项: ${totalChecks}`, 'blue');
  log(`✅ 通过: ${passedChecks}`, 'green');
  log(`❌ 失败: ${failedChecks}`, 'red');
  console.log();

  if (failedChecks === 0) {
    success('🎉 Phase 1 所有检查项通过！');
    console.log();
    
    // 提供下一步指引
    section('🚀 下一步操作');
    console.log();
    info('Phase 1 验证完成！现在你可以：');
    console.log();
    console.log('  1️⃣  运行冒烟测试（首次需要构建 h5App）：');
    console.log('     cd web-e2e');
    console.log('     npm install                              # 安装依赖');
    console.log('     npm run install:browsers                 # 安装浏览器');
    console.log('     cd .. && ./gradlew :h5App:jsBrowserProductionWebpack  # 构建 h5App');
    console.log('     cd web-e2e && npm run serve              # 终端1: 启动服务器');
    console.log('     npm run test:smoke                        # 终端2: 运行测试');
    console.log();
    console.log('  2️⃣  查看详细指南：');
    console.log('     web-e2e/QUICKSTART.md                    # 快速启动指南');
    console.log('     web-e2e/VERIFICATION-CHECKLIST.md        # 验证清单');
    console.log();
    console.log('  3️⃣  开始 Phase 2：创建 web-test 测试页面');
    console.log();
    
  } else {
    error('❌ Phase 1 验证未完全通过，请检查失败项！');
    console.log();
    info('查看详细文档: web-e2e/QUICKSTART.md');
    console.log();
    process.exit(1);
  }
}

main().catch(console.error);
