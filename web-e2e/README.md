# Kuikly Web E2E 测试

基于 Playwright 的端到端测试框架，覆盖 KuiklyUI Web 渲染层（`core-render-web` + `h5App`）的组件渲染、样式、交互、动画全流程验证。

## 📊 当前状态

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 基础设施（KuiklyPage Fixture、本地服务器） | ✅ 完成 |
| Phase 2 | web-test 专用测试页面（21 个 Kotlin 页面） | ✅ 完成 |
| Phase 3 | L0 静态用例（72 tests，截图基准已生成） | ✅ 完成 |
| Phase 4 | L1/L2 交互用例（63 tests） | ✅ 完成 |
| Phase 5 | 动画测试（22 tests，PAG 占位 skip） | ✅ 完成 |
| Phase 6 | 覆盖率 + CLI 统一入口 | ✅ 完成 |

**当前测试总量：157 tests**（不含 skip）

---

## 🚀 快速开始

> 首次使用请先阅读 [QUICKSTART.md](./QUICKSTART.md)

```bash
cd web-e2e

# 安装依赖（首次）
npm install && npx playwright install chromium

# 下载字体（首次，约 1 分钟）
npm run setup

# 运行全量测试（Playwright 自动启动服务器）
npm test

# 运行指定级别
npm run test:L0    # L0 静态渲染（72 tests）
npm run test:L1    # L1 简单交互（15 tests）
npm run test:L2    # L2 复杂交互 + 动画（70 tests）
```

---

## 📁 目录结构

```
web-e2e/
├── fixtures/
│   ├── kuikly-page.ts          # KuiklyPage 核心工具类
│   ├── test-base.ts            # 扩展 test 对象（注入 kuiklyPage fixture）
│   └── coverage.ts             # 覆盖率收集工具
├── tests/
│   ├── L0-static/
│   │   ├── smoke.spec.ts       # 冒烟测试（基础设施验证）
│   │   ├── components/         # 组件静态渲染（krview、krtext、krlist 等，8 spec）
│   │   └── styles/             # CSS 样式（border、shadow、gradient 等，7 spec）
│   ├── L1-simple/              # 简单交互（click、input、modal，3 spec）
│   └── L2-complex/
│       ├── listscroll.spec.ts  # 列表滚动
│       ├── gesture.spec.ts     # 手势
│       ├── navigation.spec.ts  # 页面跳转
│       ├── search.spec.ts      # 组合场景（搜索）
│       ├── form.spec.ts        # 组合场景（表单）
│       └── animations/         # 动画（css-transition、property-anim、js-frame-anim、pag-anim）
├── scripts/
│   ├── kuikly-test.mjs         # CLI 统一入口
│   ├── serve.js                # 普通测试服务器（port 8080）
│   ├── serve-instrumented.mjs  # 插桩版服务器（覆盖率用）
│   ├── instrument.mjs          # Istanbul 插桩脚本
│   └── coverage-report.mjs     # 覆盖率报告生成（跨平台路径封装）
├── playwright.config.js        # Playwright 配置（viewport: 375×812，Chromium）
├── .nycrc.json                 # 覆盖率阈值配置
└── package.json
```

---

## 🧪 测试级别

### L0 — 静态渲染
验证组件和样式的首屏渲染结果，纯截图对比，无交互操作。

```bash
npm run test:L0
# 或只跑冒烟
npm run test:smoke
```

### L1 — 简单交互
验证点击、文本输入、弹窗等基础交互后的视觉变化。

```bash
npm run test:L1
```

### L2 — 复杂交互 + 动画
验证列表滚动、手势、页面跳转、CSS Transition、属性动画、JS 帧动画等。

```bash
npm run test:L2
```

---

## 📝 编写测试用例

所有用例通过 `KuiklyPage` Fixture 操作页面：

```typescript
import { test, expect } from '../../fixtures/test-base';

test.describe('KRListView 列表滚动测试', () => {
  test('列表应支持垂直滚动', async ({ kuiklyPage }) => {
    // 导航到测试页面
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // L0：初始截图
    await expect(kuiklyPage.page).toHaveScreenshot('list-initial.png', {
      maxDiffPixels: 100,
    });

    // L2：滚动操作
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 300 });
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('list-scrolled.png', {
      maxDiffPixels: 100,
    });
  });
});
```

### 导入路径规则

| 文件位置 | 导入路径 |
|----------|----------|
| `tests/L0-static/smoke.spec.ts` | `'../../fixtures/test-base'` |
| `tests/L0-static/components/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/L0-static/styles/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/L1-simple/*.spec.ts` | `'../../fixtures/test-base'` |
| `tests/L2-complex/*.spec.ts` | `'../../fixtures/test-base'` |
| `tests/L2-complex/animations/*.spec.ts` | `'../../../fixtures/test-base'` |

---

## 🔧 KuiklyPage Fixture API

### 导航与等待

```typescript
await kuiklyPage.goto('TestPageName');
// 等价于 page.goto('?page_name=TestPageName')

await kuiklyPage.waitForRenderComplete();
// 等待网络 idle + 100ms 渲染稳定，默认 timeout 30s
```

### 组件定位

```typescript
// 通过 data-kuikly-component 定位（返回 Locator，可链式调用）
const list  = kuiklyPage.component('KRListView').first();
const input = kuiklyPage.component('KRInputView').nth(1);

// 获取所有同类型组件（返回 Locator[]）
const allViews = await kuiklyPage.components('KRView');

// 获取组件树（调试用）
const tree = await kuiklyPage.getComponentTree();
```

### 滚动 / 手势

```typescript
await kuiklyPage.scrollInContainer(locator, { deltaX?, deltaY?, smooth? });
await kuiklyPage.swipeInContainer(locator, { direction: 'up'|'down'|'left'|'right', distance });
```

### 动画

```typescript
const frames = await kuiklyPage.captureAnimationFrames({ interval: 100, maxDuration: 2000 });
await kuiklyPage.waitForAnimationEnd();
await kuiklyPage.waitForTransitionEnd(locator);
const styles = await kuiklyPage.getComputedStyles(locator, ['opacity', 'transform']);

// 帧差异分析
kuiklyPage.framesDiffer(frameA, frameB, { threshold? });   // boolean
kuiklyPage.countFrameDiffs(frames, { threshold? });         // number
```

---

## 📊 覆盖率报告

覆盖率收集已集成在测试 fixture 中，**每个测试结束后自动将 `window.__coverage__` 写入 `.nyc_output/`**，无需手动导出，无需两个终端。

```bash
# Step 1：插桩
npm run instrument

# Step 2：后台启动插桩版服务器（Playwright 会自动复用已有服务器）
node scripts/serve-instrumented.mjs &

# Step 3：运行测试（覆盖率数据自动写入 .nyc_output/）
npm test

# Step 4：生成报告
npm run coverage
# 报告路径：reports/coverage/index.html

# Step 5：检查是否达标
npm run coverage:check
```

> 💡 也可以用 CLI 一键执行全流程：`node scripts/kuikly-test.mjs --full`

### 覆盖率阈值（`.nycrc.json`）

| 指标 | 阈值 |
|------|------|
| lines / functions / statements | ≥ 70% |
| branches | ≥ 55% |

---

## 🖥️ CLI 统一入口

`scripts/kuikly-test.mjs` 封装了完整流程：

```bash
# 直接运行测试（跳过构建，最常用）
node scripts/kuikly-test.mjs --level L0 --skip-build

# 全流程：构建 → 插桩 → 测试 → 覆盖率报告
node scripts/kuikly-test.mjs --full

# 其他选项
--level L0|L1|L2        只运行指定级别
--test <file>           只运行指定文件
--update-snapshots      更新截图基准
--coverage-only         仅生成覆盖率报告（基于已有 .nyc_output）
--instrument            仅执行插桩
--with-native           插桩时同时处理 nativevue2.js
--headed                有界面模式
--debug                 调试模式
```

---

## 🤖 AI 辅助（CodeBuddy Skill）

```bash
# 分析测试页面源码，自动生成完整测试用例
@skill kuikly-test generate <TestPageName>

# 一键运行测试
@skill kuikly-test run [--level L0|L1|L2]

# 查看覆盖率摘要
@skill kuikly-test coverage

# 查看用例编写规范和 Fixture API
@skill kuikly-test guide
```

Skill 定义文件：`.codebuddy/rules/kuikly-test.md`

---

## 🐛 常见问题

**Q: 截图对比失败？**

打开可视化报告，直接对比实际/期望/差异截图：
```bash
npx playwright show-report reports/html
```
若差异符合预期，更新基准：
```bash
npm run test:update-snapshots
```
若在不同平台间存在轻微差异，确认已执行 `npm run setup` 下载 Web Font；当前 `maxDiffPixelRatio` 为 `0.02`，可在 `playwright.config.js` 中适当调整。

**Q: 端口 8080 被占用？**

配置了 `reuseExistingServer: true`，已有服务器会被直接复用。如需修改端口，同步更新 `playwright.config.js` 中的 `webServer.port` 和 `use.baseURL`。

**Q: 如何只运行单个测试文件？**
```bash
npx playwright test tests/L1-simple/click.spec.ts
```

**Q: 如何以有界面模式调试？**
```bash
npm run test:headed   # 有界面运行
npm run test:ui       # Playwright UI 模式（推荐）
npm run test:debug    # 单步调试模式
```

**Q: 新增组件后如何添加测试？**

1. 在 `demo/.../pages/web_test/` 中创建 Kotlin 测试页面
2. 用 `@skill kuikly-test generate <TestPageName>` 自动生成用例
3. 运行 `npx playwright test --update-snapshots` 生成初始截图基准

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 新人快速上手（5 分钟跑通第一个测试） |
| [../AUTOTEST.md](../AUTOTEST.md) | 完整测试方案设计（架构 / 规范 / 实施计划） |
| [../.codebuddy/rules/kuikly-test.md](../.codebuddy/rules/kuikly-test.md) | CodeBuddy Skill 定义 |
| [Playwright 文档](https://playwright.dev) | Playwright 官方文档 |
