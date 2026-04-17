# Kuikly Web E2E 测试

基于 Playwright 的端到端测试框架，覆盖 KuiklyUI Web 渲染层（`core-render-web` + `h5App`）的组件渲染、样式、交互、动画全流程验证。

## 📊 当前状态

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 基础设施（KuiklyPage Fixture、本地服务器） | ✅ 完成 |
| Phase 2 | web-test 专用测试页面（当前实现以仓库中的页面清单为准） | ✅ 完成 |
| Phase 3 | static 确定性断言用例（数量以当前测试目录为准） | ✅ 完成 |
| Phase 4 | functional / visual 语义用例（数量以当前测试目录为准） | ✅ 完成 |
| Phase 5 | 动画与复合场景语义拆分（数量以当前测试目录为准） | ✅ 完成 |
| Phase 6 | 覆盖率 + CLI 统一入口 | ✅ 完成 |

**说明：** 页面数和用例数会随测试面扩展持续变化，README 不再维护易漂移的固定统计值，实际规模以 `demo/.../web_test/` 和 `web-e2e/tests/` 当前内容为准。

**硬性约束：** `web-e2e/tests/` 中所有正式 E2E 用例都只能访问 `demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/` 下的页面。若现有 `web_test` 没有满足测试目标的页面，必须先补建 `web_test` 页面，再新增或改造 spec；禁止继续依赖普通 Demo 页面。

---

## 🚀 快速开始

> 首次使用请先阅读 [QUICKSTART.md](./QUICKSTART.md)

```bash
cd web-e2e

# 安装依赖（首次）
npm install && npx playwright install chromium

# 下载字体（首次，可选；若无法访问 Google Fonts 可跳过）
npm run setup

# 标准入口：本地一键完整闭环
node scripts/kuikly-test.mjs --full

# 仅在本地调试单轮用例时，可直接运行 Playwright（不生成正式覆盖率报告）
npm test

# 运行指定语义分组
npm run test:static      # static：确定性断言
npm run test:functional  # functional：交互触发的状态变化
npm run test:visual      # visual：截图结论
npm run test:hybrid      # hybrid：同时覆盖 functional + visual 的组合场景
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
│   ├── static/                 # static：确定性断言（components / styles / smoke 等）
│   ├── functional/             # functional：交互触发的节点 / 属性 / 状态变化
│   └── visual/                 # visual：依赖截图结论的视觉回归与动画终态验证
├── scripts/
│   ├── kuikly-test.mjs         # CLI 统一入口
│   ├── serve.js                # 普通测试服务器（port 8080）
│   ├── serve-instrumented.mjs  # 插桩版服务器（覆盖率用）
│   ├── instrument.mjs          # Istanbul 插桩脚本
│   └── coverage-report.mjs     # NYC 官方 Kotlin 文件覆盖率报告生成（内部辅助脚本，跨平台路径封装）
├── playwright.config.js        # Playwright 配置（viewport: 375×812，Chromium）
├── .nycrc.json                 # 覆盖率阈值配置
└── package.json
```

---

## 🧪 测试级别

### static — 确定性断言
验证纯逻辑、数据结果、静态属性、确定性文本输出等不依赖截图结论的内容。

```bash
npm run test:static
# 或只跑冒烟
npm run test:smoke
```

### functional — 交互状态变化
验证点击、输入、弹窗、滚动、路由等交互触发后的节点 / 属性 / 状态变化。

```bash
npm run test:functional
```

### visual — 截图结论
验证必须依赖截图判断的复杂视觉结果，包括视觉回归与动画终态截图。

```bash
npm run test:visual
```

### hybrid — 组合断言
运行同时需要 functional 节点验证和 visual 截图验证的组合场景。

```bash
npm run test:hybrid
```

---

## 📝 编写测试用例

编写或改造用例前，先确认目标页面位于 `demo/.../pages/web_test/`。如果当前 spec 仍跳转到普通 Demo 页面，应先迁移到已有 `web_test` 页面；若没有对应页面，则先补一个新的 `web_test` 页面。

所有用例通过 `KuiklyPage` Fixture 操作页面：

```typescript
import { test, expect } from '../../fixtures/test-base';

test.describe('KRListView 列表滚动测试', () => {
  test('列表应支持垂直滚动', async ({ kuiklyPage }) => {
    // 导航到测试页面
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // visual：初始截图
    await expect(kuiklyPage.page).toHaveScreenshot('list-initial.png', {
      maxDiffPixels: 100,
    });

    // functional：滚动操作
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
| `tests/static/smoke-static.spec.ts` | `'../../fixtures/test-base'` |
| `tests/static/components/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/static/styles/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/functional/*.spec.ts` | `'../../fixtures/test-base'` |
| `tests/functional/modules/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/functional/animations/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/visual/*.spec.ts` | `'../../fixtures/test-base'` |
| `tests/visual/components/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/visual/styles/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/visual/animations/*.spec.ts` | `'../../../fixtures/test-base'` |

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

## 📊 覆盖率

覆盖率收集已集成在测试 fixture 中，**每个测试结束后自动将 `window.__coverage__` 写入 `.nyc_output/`**。覆盖率的唯一门禁与对外展示口径统一为：**NYC 官方 Kotlin 文件覆盖率结果**。

```bash
# 标准入口：CLI 一键完成构建、插桩、启动插桩服务器、执行测试、生成 NYC 官方 Kotlin 文件覆盖率报告、阈值检查
node scripts/kuikly-test.mjs --full

# 若只基于已有 .nyc_output 生成 NYC 官方 Kotlin 文件覆盖率报告
npm run coverage

# 仅检查是否达到阈值
npm run coverage:check
```

报告路径：`reports/coverage/index.html`

### 覆盖率阈值（`.nycrc.json`）

| 指标 | 阈值 |
|------|------|
| lines / functions / statements | ≥ 70% |
| branches | ≥ 55% |

---

## 🖥️ CLI 统一入口

`scripts/kuikly-test.mjs` 封装了完整流程，并满足“本地一键运行”原则：`--full` 会自动完成构建、插桩、启动插桩服务器、执行 Playwright、生成 NYC 官方 Kotlin 文件覆盖率报告并检查阈值。日常执行默认以该命令为标准入口。

```bash
# 本地调试单轮用例时，可跳过构建直接运行测试
node scripts/kuikly-test.mjs --level static --skip-build

# 全流程：构建 → 插桩 → 自动启动插桩服务器 → 测试 → NYC 官方 Kotlin 文件覆盖率报告 → 阈值检查
node scripts/kuikly-test.mjs --full

# 其他选项
--level static|functional|visual|hybrid  只运行指定语义分组
--test <file>           只运行指定文件
--update-snapshots      更新截图基准
--coverage-only         仅生成 NYC 官方 Kotlin 文件覆盖率报告（基于已有 .nyc_output）
--instrument            仅执行插桩
--with-native           插桩时同时处理 nativevue2.js（调试辅助口径，不改变正式门禁口径）
--headed                有界面模式
--debug                 调试模式
```

---

## 🤖 AI 辅助（仓库级闭环）

当前仓库的 AI 自动化测试闭环说明以 `../kuikly-web-autotest/SKILL.md` 为准，默认入口是 `run-autotest-loop.mjs`。

```bash
# 若当前在仓库根目录（KuiklyUI/）
node kuikly-web-autotest/scripts/run-autotest-loop.mjs

# 若当前已在 web-e2e/ 目录
node ../kuikly-web-autotest/scripts/run-autotest-loop.mjs
```

说明：
- `web-e2e/scripts/kuikly-test.mjs --full` 是 canonical CLI，负责单轮完整执行
- `kuikly-web-autotest/scripts/run-autotest-loop.mjs` 在其外层增加 completeness 扫描、失败分析、覆盖率补测与安全范围内自动修复
- Skill 说明与默认运行方式统一以 `../kuikly-web-autotest/SKILL.md` 和 `../kuikly-web-autotest/agents/openai.yaml` 为准

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

**Q: NYC 官方 Kotlin 文件覆盖率报告为空 / 没有数据？**

优先使用 `node scripts/kuikly-test.mjs --full`。如果直接运行普通 `npm test`，不会产生覆盖率数据；只有插桩模式才会写入 `.nyc_output/` 并生成 NYC 官方 Kotlin 文件覆盖率报告。

**Q: 如何只运行单个测试文件？**
```bash
npx playwright test tests/functional/click-functional.spec.ts
```

**Q: 如何以有界面模式调试？**
```bash
npm run test:headed   # 有界面运行
npm run test:ui       # Playwright UI 模式（推荐）
npm run test:debug    # 单步调试模式
```

**Q: 新增组件后如何添加测试？**

1. 在 `demo/.../pages/web_test/` 中创建 Kotlin 测试页面
2. 确认后续 spec 只指向该 `web_test` 页面，不要直接复用普通 Demo 页面
3. 如需 AI 闭环补测/补 coverage，可运行 `node ../kuikly-web-autotest/scripts/run-autotest-loop.mjs`（当前位于 `web-e2e/` 目录时）
4. 运行 `npx playwright test --update-snapshots` 生成或更新截图基准

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 新人快速上手（标准 CLI / 报告 / 常见操作） |
| [../AUTOTEST.md](../AUTOTEST.md) | 完整测试方案设计（架构 / 规范 / 实施计划） |
| [../kuikly-web-autotest/SKILL.md](../kuikly-web-autotest/SKILL.md) | 仓库级 AI 闭环说明 |
| [../kuikly-web-autotest/agents/openai.yaml](../kuikly-web-autotest/agents/openai.yaml) | Skill 配套元数据 |
| [Playwright 文档](https://playwright.dev) | Playwright 官方文档 |
