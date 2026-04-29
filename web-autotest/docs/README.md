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

**说明：** 页面数和用例数会随测试面扩展持续变化，README 不再维护易漂移的固定统计值，实际规模以 `demo/.../web_test/` 和 `web-autotest/tests/` 当前内容为准。

**硬性约束：** `web-autotest/tests/` 中所有正式 E2E 用例都只能访问 `demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/` 下的页面。若现有 `web_test` 没有满足测试目标的页面，必须先补建 `web_test` 页面，再新增或改造 spec；禁止继续依赖普通 Demo 页面。

---

## 🚀 快速开始

> 首次使用请先阅读 [QUICKSTART.md](./QUICKSTART.md)

```bash
cd web-autotest

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
web-autotest/
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
│   ├── serve.cjs                # 测试服务器（port 8080，支持 Kotlin modules loader）
│   ├── coverage-report.mjs     # 基于 V8 data 生成 Monocart Kotlin 覆盖率报告
├── playwright.config.js        # Playwright 配置（viewport: 375×812，Chromium）
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

正式 E2E 用例必须使用稳定、可重复的可观察结果作为断言依据，例如文本、DOM 节点、`data-kuikly-component`、属性、bounding box 或截图结论。禁止依赖运行时产物、构建产物、混淆后的导出名、内部方法名或临时注入对象作为测试 oracle。

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

### classification-policy.mjs 维护规则

大多数新增的 hand-written spec **不需要**修改 `scripts/lib/classification-policy.mjs`：只要文件已经按语义放入 `tests/static/`、`tests/functional/` 或 `tests/visual/`，CLI 就会按目录执行。

只有以下场景需要同步维护该文件：

- 调整 `--level static|functional|visual|hybrid` 的解析目标
- 新增或修改 managed spec 的页面分类映射（`CATEGORY_TARGET_SEGMENTS` / `MANAGED_TARGET_CLASSIFICATION`）
- 需要把新的 functional / visual 成对 spec 纳入 `--level hybrid` 聚合执行时，更新 `HYBRID_TARGETS`

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

覆盖率收集已集成在测试 fixture 中，**每个测试结束后会通过 Playwright Chromium V8 native coverage 将结果写入 `.v8_output/`**。正式报告使用 **Monocart** 将 V8 原始覆盖率映射回 Kotlin 源文件；阈值配置统一来自 `config/coverage.cjs`，检查时读取生成后的 `coverage-summary.json` totals。

```bash
# 标准入口：CLI 一键完成构建、启动测试服务器、执行测试、采集 V8 coverage、生成 Monocart Kotlin 覆盖率报告、执行阈值检查
node scripts/kuikly-test.mjs --full

# 若只基于已有 .v8_output 生成 Monocart Kotlin 覆盖率报告
npm run coverage

# 仅检查是否达到阈值（基于 .v8_output 重新生成 summary）
npm run coverage:check
```

Kotlin 报告路径：`reports/coverage/index.html`
产物还包含：`reports/coverage/coverage-final.json`、`reports/coverage/lcov.info`、`reports/coverage/coverage-summary.json`

### 覆盖率阈值（`config/coverage.cjs`）

| 指标 | 阈值 |
|------|------|
| lines / functions | ≥ 70% |
| branches | ≥ 55% |

---

## 🖥️ CLI 统一入口

`scripts/kuikly-test.mjs` 封装了完整流程，并满足“本地一键运行”原则：`--full` 会自动完成构建、启动测试服务器、执行 Playwright、采集 V8 coverage、生成 Monocart Kotlin 覆盖率报告并执行阈值检查。日常执行默认以该命令为标准入口。

```bash
# 本地调试单轮用例时，可跳过构建直接运行测试
node scripts/kuikly-test.mjs --level static --skip-build

# 全流程：构建 → 自动启动测试服务器 → 测试（V8 coverage mode）→ Monocart Kotlin 覆盖率报告 → 阈值检查
node scripts/kuikly-test.mjs --full

# 其他选项
--level static|functional|visual|hybrid  只运行指定语义分组
--test <file>           只运行指定文件
--update-snapshots      更新截图基准
--coverage-only         仅生成 Monocart Kotlin 覆盖率报告（基于已有 .v8_output）
--skip-build            跳过 Gradle 构建
--headed                有界面模式
--debug                 调试模式
--dry-run               仅打印解析后的测试命令
--print-resolved-targets 输出 level 解析结果
```

---

## 🤖 AI 辅助（仓库级闭环）

当前仓库的 AI 自动化测试闭环说明以 `../web-autotest/SKILL.md` 为准，默认入口是 `run-autotest-loop.mjs`。

```bash
# 若当前在仓库根目录（KuiklyUI/）
node web-autotest/scripts/run-autotest-loop.mjs

# 若当前已在 web-autotest/ 目录
node ../web-autotest/scripts/run-autotest-loop.mjs
```

说明：
- `web-autotest/scripts/kuikly-test.mjs --full` 是 canonical CLI，负责单轮完整执行
- `web-autotest/scripts/run-autotest-loop.mjs` 在其外层增加 completeness 扫描、失败分析、覆盖率补测与安全范围内自动修复
- Skill 说明与默认运行方式统一以 `../web-autotest/SKILL.md` 和 `../web-autotest/agents/openai.yaml` 为准

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

**Q: Kotlin 覆盖率报告为空 / 没有数据？**

优先使用 `node scripts/kuikly-test.mjs --full`。如果直接运行普通 `npm test`，不会产生覆盖率数据；只有 V8 coverage 模式才会写入 `.v8_output/`，随后由 Monocart 生成 Kotlin 报告并执行阈值检查。

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
3. 新增普通 hand-written spec 时，按语义放入 `tests/static/`、`tests/functional/` 或 `tests/visual/` 即可；只有调整 managed 分类路由或 hybrid 聚合范围时，才需要同步更新 `scripts/lib/classification-policy.mjs`
4. 如需 AI 闭环补测/补 coverage，可运行 `node ../web-autotest/scripts/run-autotest-loop.mjs`（当前位于 `web-autotest/` 目录时）
5. 运行 `npx playwright test --update-snapshots` 生成或更新截图基准

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 新人快速上手（标准 CLI / 报告 / 常见操作） |
| [AUTOTEST.md](./AUTOTEST.md) | 完整测试方案设计（架构 / 规范 / 实施计划） |
| [../web-autotest/SKILL.md](../web-autotest/SKILL.md) | 仓库级 AI 闭环说明 |
| [../web-autotest/agents/openai.yaml](../web-autotest/agents/openai.yaml) | Skill 配套元数据 |
| [Playwright 文档](https://playwright.dev) | Playwright 官方文档 |
