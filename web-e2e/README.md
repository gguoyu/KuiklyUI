# Kuikly Web E2E Testing

端到端测试框架，基于 Playwright，用于验证 Kuikly Web 渲染层的正确性。

## 📍 当前状态

✅ **Phase 1: 基础设施搭建（已完成）**
- ✅ 渲染层注入 `data-kuikly-component` 属性
- ✅ 创建 `web-e2e/` 目录结构
- ✅ 实现 `KuiklyPage` Fixture
- ✅ 编写 L0 冒烟测试
- ✅ 本地测试服务器

**🎯 立即开始验证？请查看 [快速启动指南 QUICKSTART.md](./QUICKSTART.md)**

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd web-e2e
npm install
npx playwright install chromium
```

### 2. 准备测试环境（3 个终端）

**终端 1 - 启动测试服务器：**
```bash
cd web-e2e
npm run serve
```

**终端 2 - 构建 JS Bundle：**
```bash
# 在项目根目录

# Step 1: 打包本地调试 Bundle
./gradlew :demo:packLocalJSBundleDebug

# Step 2: 启动 h5App 开发构建（持续监听）
./gradlew :h5App:jsBrowserDevelopmentRun -t
```

**终端 3 - 运行测试：**
```bash
cd web-e2e

# 运行所有测试
npm test

# 运行指定级别的测试
npm run test:L0    # L0 静态渲染测试
npm run test:L1    # L1 基础交互测试
npm run test:L2    # L2 复杂交互测试

# 更新截图基准
npm run test:update-snapshots
```

**⚠️ 重要提示:**
- 三个步骤必须按顺序执行
- 终端 1 和终端 2 需要持续运行
- 首次构建可能需要 5-15 分钟

## 📁 目录结构

```
web-e2e/
├── package.json              # npm 依赖配置
├── playwright.config.ts      # Playwright 配置
├── tsconfig.json             # TypeScript 配置
├── .nycrc.json              # 覆盖率配置
├── fixtures/
│   ├── kuikly-page.ts       # KuiklyPage 核心工具类
│   └── test-base.ts         # 扩展的 test 对象
├── scripts/
│   └── kuikly-test.mjs      # CLI 统一入口
├── tests/
│   ├── L0-static/           # L0 静态测试
│   ├── L1-interaction/      # L1 交互测试
│   └── L2-complex/          # L2 复杂测试
└── reports/                 # 测试报告输出
```

## 🧪 测试级别

### L0 - 静态渲染测试
- 验证组件和样式的静态渲染结果
- 纯截图对比，无交互操作
- 快速执行，适合冒烟测试

### L1 - 基础交互测试
- 点击、输入、弹窗等基础交互
- 验证交互后的视觉变化
- 覆盖常见用户操作场景

### L2 - 复杂交互测试
- 滚动、手势、动画、页面跳转
- 多步骤交互流程
- 性能和动画流畅度验证

## 📝 编写测试用例

使用 `KuiklyPage` Fixture：

```typescript
import { test, expect } from '../fixtures/test-base';

test('KRView renders correctly', async ({ kuiklyPage }) => {
  // 导航到测试页面
  await kuiklyPage.goto('?page_name=KRViewTestPage');
  
  // 等待渲染完成
  await kuiklyPage.waitForRenderComplete();
  
  // 截图验证
  await expect(kuiklyPage.page).toHaveScreenshot('kr-view-initial.png');
  
  // 定位 Kuikly 组件
  const view = kuiklyPage.component('KRView').first();
  await view.click();
  
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('kr-view-clicked.png');
});
```

## 🔧 KuiklyPage API

### 导航与等待
- `goto(pageName)` - 导航到测试页面
- `waitForRenderComplete()` - 等待渲染完成

### 组件定位
- `component(type)` - 通过 `data-kuikly-component` 定位
- `getComponentTree()` - 获取组件树（调试用）

### 滚动操作
- `scrollInContainer(container, options)` - 容器内滚动
- `swipeInContainer(container, options)` - 滑动手势

### 动画操作
- `captureAnimationFrames(options)` - 采集动画帧
- `waitForAnimationEnd()` - 等待动画结束
- `getComputedStyles(locator, props)` - 获取计算样式

## 📊 覆盖率报告

覆盖率报告使用 NYC (Istanbul) 生成：

```bash
# 查看覆盖率报告
open reports/coverage/index.html
```

## 🤖 AI 生成测试

测试用例可以由 AI 自动生成：

1. AI 读取 `demo/src/commonMain/.../pages/web_test/` 中的测试页面代码
2. 分析渲染组件类型（通过 `data-kuikly-component`）
3. 根据组件交互特征知识库生成测试用例
4. 输出到对应的 L0/L1/L2 目录

详见 [AUTOTEST.md](../AUTOTEST.md)。

## 📚 相关文档

- [ENVIRONMENT-SETUP.md](./ENVIRONMENT-SETUP.md) - 环境准备详细指南（⭐ 首次必读）
- [QUICKSTART.md](./QUICKSTART.md) - 快速启动指南
- [VERIFICATION-RESULT.md](./VERIFICATION-RESULT.md) - Phase 1 验证结果
- [AUTOTEST.md](../AUTOTEST.md) - 完整测试方案
- [Playwright Documentation](https://playwright.dev)
- [NYC Documentation](https://github.com/istanbuljs/nyc)
