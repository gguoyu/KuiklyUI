# Kuikly Web E2E 测试 Skill

> 本 Skill 用于辅助 KuiklyUI Web 模块（`core-render-web` + `h5App`）的自动化测试工作。
> 覆盖：一键运行测试、用例编写指导、AI 自动生成测试用例、查看覆盖率。

---

## 一、Skill 能力速查

| 指令 | 说明 |
|------|------|
| `@skill kuikly-test auto` | **全自动闭环**：运行 → 分析 → 修复/补用例 → 覆盖率检查，循环直到全部达标 |
| `@skill kuikly-test run [--level L0\|L1\|L2]` | 一键运行指定级别（或全量）E2E 测试 |
| `@skill kuikly-test generate <TestPageName>` | 分析测试页面源码，AI 自动生成完整测试用例 |
| `@skill kuikly-test guide` | 输出用例编写模板、Fixture API 说明、最佳实践 |
| `@skill kuikly-test coverage` | 展示当前覆盖率摘要 |

---

## 二、项目上下文

### 2.1 目录结构

```
KuiklyUI/
├── core-render-web/          # Web 渲染内核（Kotlin/JS）
├── h5App/                    # H5 应用层（Kotlin/JS）
├── demo/src/commonMain/kotlin/.../pages/web_test/   # 专用测试页面（Kotlin）
│   ├── components/           # 组件测试页 (L0)
│   ├── styles/               # 样式测试页 (L0)
│   ├── interactions/         # 交互测试页 (L1/L2)
│   ├── animations/           # 动画测试页 (L2)
│   └── composite/            # 组合场景页 (L1/L2)
└── web-e2e/                  # E2E 测试工程
    ├── fixtures/
    │   ├── kuikly-page.ts    # KuiklyPage Fixture（核心工具类）
    │   ├── test-base.ts      # 测试基础导出
    │   └── coverage.ts       # 覆盖率收集
    ├── tests/
    │   ├── L0-static/        # 静态渲染截图测试
    │   │   ├── components/   # krview、krtext、krlist 等
    │   │   └── styles/       # border、shadow、gradient 等
    │   ├── L1-simple/        # 简单交互测试（click、input、modal）
    │   └── L2-complex/       # 复杂交互测试（listscroll、gesture、navigation、animations、composite）
    ├── scripts/
    │   ├── kuikly-test.mjs   # CLI 统一入口
    │   ├── serve.js          # 普通测试服务器
    │   ├── serve-instrumented.mjs  # 插桩版服务器（覆盖率）
    │   └── instrument.mjs    # Istanbul 插桩脚本
    ├── playwright.config.js  # Playwright 配置
    └── package.json
```

### 2.2 渲染层标记约定

KuiklyUI Web 渲染层会为每个渲染组件注入 `data-kuikly-component` 属性：

```html
<div data-kuikly-component="KRListView" id="...">
  <div data-kuikly-component="KRView">
    <div data-kuikly-component="KRTextView">...</div>
    <div data-kuikly-component="KRImageView">...</div>
  </div>
</div>
```

这是 E2E 测试中**定位组件的核心手段**，通过 `kuiklyPage.component('KRXxxView')` 访问。

### 2.3 测试页面访问方式

```
http://localhost:8080/?page_name=KRListViewTestPage
http://localhost:8080/?page_name=ClickTestPage
```

每个测试页面通过 `@Page` 注解注册独立路由。

### 2.4 测试运行环境

| 参数 | 值 | 说明 |
|------|----|------|
| 浏览器 | Chromium | 仅配置 Chromium，暂不扩展 Firefox/WebKit |
| Viewport | `375 × 812` | iPhone X 尺寸，截图基准按此尺寸生成 |
| baseURL | `http://localhost:8080` | Playwright 自动启动服务器并复用已有实例 |
| timeout | 60s | 单个用例超时时间 |
| retries | CI: 2，本地: 1 | 失败重试次数 |

> ⚠️ 截图基准与 viewport 尺寸强绑定。在不同 viewport 下运行会导致截图对比失败，请勿修改此配置。

---

## 三、一键运行（run 指令）

### 3.1 指令格式

```bash
# 全量测试（L0 + L1 + L2）
@skill kuikly-test run

# 只运行指定级别
@skill kuikly-test run --level L0
@skill kuikly-test run --level L1
@skill kuikly-test run --level L2

# 全流程（构建 → 插桩 → 测试 → 覆盖率报告）
@skill kuikly-test run --full
```

### 3.2 执行步骤

当用户触发 `run` 指令时，按以下步骤执行：

1. **服务器说明**：`playwright.config.js` 中已配置 `webServer`，运行 `npx playwright test` 时 Playwright 会**自动启动** `node scripts/serve.js`（端口 8080）。若端口已被占用（如用户自己启动了服务器），Playwright 会直接复用，**无需手动操作**。
2. **执行测试命令**：

```bash
# 在 web-e2e/ 目录下执行
cd web-e2e

# 全量
npx playwright test

# 指定级别
npx playwright test tests/L0-static   # L0
npx playwright test tests/L1-simple   # L1
npx playwright test tests/L2-complex  # L2
```

3. **输出结果摘要**：展示通过/失败数量、失败用例名称

### 3.3 快捷 npm 脚本

```bash
cd web-e2e
npm run test:L0          # 运行 L0 静态测试
npm run test:L1          # 运行 L1 简单交互测试
npm run test:L2          # 运行 L2 复杂交互测试
npm test                 # 运行全量测试
npm run test:smoke       # 运行冒烟测试（快速验证）

# 覆盖率模式（无需两个终端，后台启动插桩服务器）
npm run instrument                    # Istanbul 插桩
node scripts/serve-instrumented.mjs & # 后台启动插桩版服务器
npm test                              # 运行测试，覆盖率数据自动写入 .nyc_output/
npm run coverage                      # 生成覆盖率报告
npm run coverage:check                # 检查覆盖率是否达标

# CLI 统一入口
node scripts/kuikly-test.mjs --level L0 --skip-build
node scripts/kuikly-test.mjs --full --with-native
node scripts/kuikly-test.mjs --coverage-only
```

---

## 四、AI 自动生成（generate 指令）

### 4.1 指令格式

```bash
@skill kuikly-test generate <TestPageName>
# 示例：
@skill kuikly-test generate KRListViewTestPage
@skill kuikly-test generate SearchTestPage
@skill kuikly-test generate CSSTransitionTestPage
```

### 4.2 自动生成流程

当用户触发 `generate <TestPageName>` 时，按以下步骤执行：

**Step 1：读取测试页面源码**

```
路径：demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/**/<TestPageName>.kt
```

分析页面中使用的 KuiklyUI Compose 组件（如 `KRList`、`KRText`、`Input` 等），推断渲染到 DOM 的底层组件类型。

**Step 2：查询「组件交互特征知识库」（见第五节）**

识别页面中所有 `KRXxxView` 渲染组件，查表获取每种组件**必须验证的交互操作清单**。

**Step 3：确定测试级别和输出路径**

- 仅有 L0 操作 → `web-e2e/tests/L0-static/components/<name>.spec.ts`
- 含 L1 操作 → `web-e2e/tests/L1-simple/<name>.spec.ts`
- 含 L2 操作 → `web-e2e/tests/L2-complex/<name>.spec.ts`
- 取最高级别（L2 > L1 > L0）

**Step 4：生成完整测试用例代码**

- 严格遵循第六节「用例编写规范」
- 每个操作步骤都包含：定位 → 操作 → 等待渲染 → 截图/断言
- 不可遗漏任何组件必须验证的交互

**Step 5：输出文件**

生成 `.spec.ts` 文件，同时说明：
- 需要更新截图基准：`npx playwright test --update-snapshots`
- 测试文件位置和测试数量

### 4.3 关键原则（不可遗漏）

> 如果页面渲染出了 `KRListView`，生成的用例**必须**包含滚动操作。
> 如果渲染出了 `KRInputView`，生成的用例**必须**包含输入操作。
> 如果渲染出了 `KRModalView`，生成的用例**必须**包含弹出/关闭操作。
> 这不由人去发现并补充，而是通过查「组件交互特征知识库」自动推导。

---

## 五、组件交互特征知识库

> AI 生成测试用例时**必须**查阅此表，根据页面中出现的渲染组件自动推导所有必须覆盖的交互操作。

### 5.1 渲染组件 → 必须验证的交互操作映射表

| 渲染组件（`data-kuikly-component`） | 必须自动包含的交互操作 | 测试级别 |
|--------------------------------------|----------------------|----------|
| `KRView` | ① 静态渲染截图 ② 如有点击行为：click → 验证状态变化 ③ 如有手势：拖拽/缩放 → 验证效果 | L0/L1/L2 |
| `KRTextView` | ① 静态渲染截图（验证文本内容、样式正确） | L0 |
| `KRRichTextView` | ① 静态渲染截图（验证富文本样式）② 如有可点击 Span：click → 验证跳转/效果 | L0/L1 |
| `KRGradientRichTextView` | ① 静态渲染截图（验证渐变富文本渲染正确） | L0 |
| `KRImageView` | ① 等待图片加载完成 ② 截图验证（渲染正确、无白图/破图） | L0 |
| `KRListView` | ① 垂直/水平滚动（根据方向属性判断）→ 每步截图 ② 滚动到边界 ③ 列表项点击（如有 clickable 子元素）④ 如有 stickyHeader：验证吸顶 ⑤ 如有分页（paging）：滑动翻页 → 验证每页内容 | L2 |
| `KRScrollContentView` | ① 垂直/水平滚动 → 每步截图 ② 滚动到边界验证 | L2 |
| `KRTextFieldView` / `KRInputView` | ① 点击获取焦点 ② 输入文本 ③ 验证显示 ④ 清空重新输入 ⑤ 点击外部失去焦点 | L1 |
| `KRCanvasView` | ① 静态截图验证绘制正确 | L0 |
| `KRVideoView` | ① 等待视频加载 ② 截图验证首帧渲染（不验证播放流程） | L0 |
| `KRModalView` | ① 触发弹出 ② 截图弹窗 ③ 弹窗内交互 ④ 关闭弹窗 ⑤ 截图确认关闭 | L1 |

### 5.2 Compose 层组件 → 底层渲染组件映射

> 当分析 Kotlin 测试页面源码时，通过以下映射推断 DOM 中出现的渲染组件：

| Compose 层组件 | 底层渲染组件（DOM 中） |
|----------------|----------------------|
| `KRText()`、`text {}` | `KRTextView` |
| `KRImage()`、`image {}` | `KRImageView` |
| `KRList()`、`list {}` | `KRListView` |
| `KRScrollView()`、`scroll {}` | `KRScrollContentView` |
| `KRInput()`、`input {}` | `KRInputView` / `KRTextFieldView` |
| `KRRichText()`、`richText {}` | `KRRichTextView` |
| `KRCanvas()`、`canvas {}` | `KRCanvasView` |
| `view {}`、`KRView()` | `KRView` |

### 5.3 AI 推导示例

**测试页面 `SearchTestPage.kt` 中包含：**
```kotlin
input { ... }         // → KRInputView
list { ... }          // → KRListView
image { ... }         // → KRImageView (列表项中)
text { ... }          // → KRTextView
```

**AI 自动推导结果：**

| 识别到的渲染组件 | 查表必须包含的交互 |
|-----------------|------------------|
| `KRInputView` | 点击获取焦点 → 输入文本 → 验证显示 |
| `KRListView` | 垂直滚动 × 多次 + 截图 |
| `KRView`（列表项） | 点击列表项 + 验证状态变化 |
| `KRImageView` | 等待加载 + 截图验证 |
| `KRTextView` | 初始渲染截图 |

最终测试级别：**L2**（取最高）。

---

## 六、用例编写规范

### 6.1 文件命名约定

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| L0 冒烟测试 | `web-e2e/tests/L0-static/smoke.spec.ts` | `smoke.spec.ts` |
| L0 组件测试 | `web-e2e/tests/L0-static/components/kr{component}.spec.ts` | `krlist.spec.ts` |
| L0 样式测试 | `web-e2e/tests/L0-static/styles/{style}.spec.ts` | `border.spec.ts` |
| L1 测试 | `web-e2e/tests/L1-simple/{interaction}.spec.ts` | `click.spec.ts` |
| L2 交互/组合测试 | `web-e2e/tests/L2-complex/{scenario}.spec.ts` | `listscroll.spec.ts` |
| L2 动画测试 | `web-e2e/tests/L2-complex/animations/{anim}.spec.ts` | `css-transition.spec.ts` |
| 截图基准 | `{spec-file}-snapshots/{name}-chromium-win32.png` | `krlist.spec.ts-snapshots/krlist-static-chromium-win32.png` |

### 6.2 标准用例结构模板

```typescript
/**
 * L{N} {类型}测试：{描述}
 *
 * 测试页面：{TestPageName}
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. {具体验证点1}
 * 3. {具体验证点2}
 * ...
 */

import { test, expect } from '../../fixtures/test-base';  // 根据深度调整相对路径

test.describe('{描述}', () => {

  // ── 冒烟：页面加载 ─────────────────────────────────────
  test('应该成功加载 {TestPageName} 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('{TestPageName}');
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.locator('text={页面标题关键字}')).toBeVisible();
  });

  // ── L0：初始渲染截图 ───────────────────────────────────
  test('视觉回归：{TestPageName} 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('{TestPageName}');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page).toHaveScreenshot('{name}-initial.png', {
      maxDiffPixels: 100,
    });
  });

  // ── L1/L2：交互用例（根据组件交互特征知识库生成） ──────
  test('{交互描述}', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('{TestPageName}');
    await kuiklyPage.waitForRenderComplete();

    // 每步：定位 → 操作 → 等待 → 验证
    const target = kuiklyPage.component('KRXxxView').first();
    await target.{action}(...);
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page).toHaveScreenshot('{name}-after-{action}.png', {
      maxDiffPixels: 100,
    });
  });
});
```

### 6.3 test-base 导入路径规则

| 文件位置 | 导入路径 |
|----------|----------|
| `tests/L0-static/smoke.spec.ts` | `'../../fixtures/test-base'` |
| `tests/L0-static/components/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/L0-static/styles/*.spec.ts` | `'../../../fixtures/test-base'` |
| `tests/L1-simple/*.spec.ts` | `'../../fixtures/test-base'` |
| `tests/L2-complex/*.spec.ts` | `'../../fixtures/test-base'` |
| `tests/L2-complex/animations/*.spec.ts` | `'../../../fixtures/test-base'` |

### 6.4 截图对比参数规范

```typescript
// 静态内容（字体渲染稳定）
await expect(kuiklyPage.page).toHaveScreenshot('name.png', { maxDiffPixels: 100 });

// 动态内容或有动画后的截图
await expect(kuiklyPage.page).toHaveScreenshot('name.png', { maxDiffPixels: 300 });

// 更新基准（仅在本地运行，不在 CI 中）
// npx playwright test --update-snapshots
```

### 6.5 元素定位优先级

| 优先级 | 定位方式 | 适用场景 | 示例 |
|--------|----------|----------|------|
| **1（首选）** | `kuiklyPage.component('KRXxxView')` | 按渲染组件类型定位 | `.component('KRListView').first()` |
| **2** | `page.getByText('文本')` | 按可见文本定位 | `.getByText('点击我')` |
| **3** | `page.locator('[data-testid="xxx"]')` | 按 testId 属性 | - |
| **4（兜底）** | 坐标点击 | 无法通过属性区分时 | `page.click({ x: 187, y: 400 })` |

---

## 七、KuiklyPage Fixture API

### 7.1 导航与等待

```typescript
// 导航到测试页面
await kuiklyPage.goto('TestPageName');
// 等价于：await page.goto('?page_name=TestPageName')

// 等待渲染完成（网络 idle + 100ms 稳定期）
await kuiklyPage.waitForRenderComplete(timeout?: number);
// 默认 timeout: 30000ms
```

### 7.2 组件定位

```typescript
// 按 data-kuikly-component 类型定位（返回 Locator）
const list = kuiklyPage.component('KRListView');
const firstItem = kuiklyPage.component('KRView').first();
const secondInput = kuiklyPage.component('KRInputView').nth(1);

// 获取所有同类型组件（返回 Locator[]）
const allViews = await kuiklyPage.components('KRView');

// 获取组件树结构（调试用）
const tree = await kuiklyPage.getComponentTree();
// 返回：[{ type, id, tagName, className }, ...]
```

### 7.3 滚动操作

```typescript
// 在容器内滚动（deltaX/deltaY 为像素值）
await kuiklyPage.scrollInContainer(container: Locator, {
  deltaX?: number,  // 水平滚动距离
  deltaY?: number,  // 垂直滚动距离
  smooth?: boolean  // 平滑滚动（默认 true）
});

// 示例：向下滚动 300px
const list = kuiklyPage.component('KRListView').first();
await kuiklyPage.scrollInContainer(list, { deltaY: 300 });

// 获取页面上所有可滚动容器
const containers = await kuiklyPage.getScrollContainers();
```

### 7.4 手势操作

```typescript
// 在容器内执行滑动手势
await kuiklyPage.swipeInContainer(container: Locator, {
  direction: 'up' | 'down' | 'left' | 'right',
  distance: number  // 像素距离
});

// 示例：向左滑动翻页
const carousel = kuiklyPage.component('KRView').first();
await kuiklyPage.swipeInContainer(carousel, { direction: 'left', distance: 300 });
```

### 7.5 动画操作

```typescript
// 按帧间隔截图（返回 Buffer[]）
const frames = await kuiklyPage.captureAnimationFrames({
  interval: 100,      // 每帧间隔 ms
  maxDuration: 2000   // 最大录制时长 ms
});

// 等待所有 CSS transition/animation 结束
await kuiklyPage.waitForAnimationEnd();

// 等待指定元素的 transitionend 事件
await kuiklyPage.waitForTransitionEnd(locator: Locator);

// 获取元素计算样式
const styles = await kuiklyPage.getComputedStyles(locator, ['opacity', 'transform']);
// 返回：{ opacity: '0.5', transform: 'matrix(...)' }
```

### 7.6 帧差异分析

```typescript
// 比较两帧截图是否存在视觉差异
const differ = kuiklyPage.framesDiffer(frameA: Buffer, frameB: Buffer, {
  threshold?: number  // 差异字节比例阈值（默认 0.001）
});
// 返回：boolean

// 统计帧序列中有差异的相邻帧对数量
const diffCount = kuiklyPage.countFrameDiffs(frames: Buffer[], {
  threshold?: number
});
// 用法：expect(diffCount).toBeGreaterThan(2);（验证动画确实在运动）
```

### 7.7 完整用例示例

```typescript
import { test, expect } from '../../fixtures/test-base';

test.describe('KRListView 列表滚动测试', () => {
  test('列表应支持垂直滚动', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // L0: 初始截图
    await expect(kuiklyPage.page).toHaveScreenshot('list-initial.png', {
      maxDiffPixels: 100,
    });

    // L2: 滚动操作
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 300 });
    await kuiklyPage.waitForRenderComplete();

    // 截图验证滚动后内容
    await expect(kuiklyPage.page).toHaveScreenshot('list-scrolled-300.png', {
      maxDiffPixels: 100,
    });

    // 继续滚动到底部
    await kuiklyPage.scrollInContainer(list, { deltaY: 1000 });
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('list-bottom.png', {
      maxDiffPixels: 100,
    });
  });
});
```

---

## 八、测试页面设计原则

> 新增测试页面时必须遵循以下原则（由 AI Review 核查）：

| 原则 | 说明 |
|------|------|
| **单一职责** | 每个测试页面只验证**一种组件或一种样式** |
| **内容确定性** | 使用硬编码固定数据，不依赖网络请求或动态数据 |
| **布局稳定** | 页面布局固定不变，确保截图基准长期有效 |
| **命名规范** | 统一使用 `{组件/样式名}TestPage` 命名 |
| **完整覆盖** | 覆盖该组件/样式的**所有变体**（字号、颜色、对齐等） |
| **无外部依赖** | 所有数据内嵌在页面中，不调用网络接口 |
| **可独立访问** | 每个测试页面有独立路由，可通过 URL 直接打开 |

### 8.1 现有测试页面清单

**L0 — 静态渲染页面**（`web_test/components/` 和 `web_test/styles/`）

| 页面 | 验证目标 |
|------|----------|
| `KRViewTestPage` | KRView 基础渲染（不同尺寸/背景色/圆角） |
| `KRTextViewTestPage` | 文本渲染（字号/颜色/对齐/多行/截断/行高） |
| `KRRichTextViewTestPage` | 富文本（多种 Span 样式） |
| `KRGradientRichTextTestPage` | 渐变富文本渲染 |
| `KRImageViewTestPage` | 图片渲染（尺寸/缩放模式/圆角/placeholder） |
| `KRCanvasViewTestPage` | Canvas 绘制（线段/圆/矩形/渐变） |
| `KRListViewTestPage` | KRListView 静态渲染（L0 仅验证首屏） |
| `KRScrollContentViewTestPage` | KRScrollContentView 静态渲染 |
| `BorderTestPage` | border / borderRadius |
| `ShadowTestPage` | shadow |
| `GradientTestPage` | gradient（线性/径向/多色） |
| `TransformTestPage` | transform（rotate/scale/translate/skew） |
| `OpacityTestPage` | opacity |
| `OverflowTestPage` | overflow（hidden/visible/scroll） |

**L1 — 简单交互页面**（`web_test/interactions/`）

| 页面 | 验证目标 |
|------|----------|
| `ClickTestPage` | 点击事件（按钮/Tab 切换/开关/复选框） |
| `InputTestPage` | 输入交互（文本框/密码框/多行输入） |
| `ModalTestPage` | 弹窗交互（对话框/底部弹窗/弹窗内交互） |

**L2 — 复杂交互页面**（`web_test/interactions/` 和 `web_test/animations/`）

| 页面 | 验证目标 |
|------|----------|
| `ListScrollTestPage` | 列表滚动（50 项 + stickyHeader + 可点击项） |
| `GestureTestPage` | 手势操作（水平翻页/可拖拽元素） |
| `NavigationTestPage` | 页面跳转（跳转/子页面/返回） |
| `CSSTransitionTestPage` | CSS Transition 动画 |
| `JSFrameAnimTestPage` | JS 帧动画（rAF 驱动） |
| `PropertyAnimTestPage` | KR 属性动画（Kotlin/JS 驱动） |

**组合场景**（`web_test/composite/`）

| 页面 | 验证目标 |
|------|----------|
| `SearchTestPage` | 组合场景（搜索框 + 搜索按钮 + 结果列表） |
| `FormTestPage` | 组合场景（多输入框 + 开关 + 提交按钮） |

---

## 九、覆盖率查看（coverage 指令）

### 9.1 指令格式

```bash
@skill kuikly-test coverage
```

### 9.2 执行步骤

当用户触发 `coverage` 指令时：

1. **检查 `.nyc_output/` 目录**：
   - 若不存在或为空，说明未以插桩模式运行过测试，**自动执行以下步骤收集数据**：
     ```bash
     cd web-e2e
     npm run instrument                    # Step 1: 插桩
     node scripts/serve-instrumented.mjs & # Step 2: 后台启动插桩服务器
     sleep 2                               # 等待服务器就绪
     npm test                              # Step 3: 运行全量测试，自动收集覆盖率数据
     ```
   - 若已有数据，跳过上述步骤，直接生成报告
2. **生成报告**：
   ```bash
   cd web-e2e && npm run coverage
   ```
3. **检查阈值**：
   ```bash
   cd web-e2e && npm run coverage:check
   ```
4. **展示摘要**：输出 lines / functions / statements / branches 覆盖率数值

### 9.3 覆盖率阈值（`.nycrc.json`）

| 指标 | 阈值 |
|------|------|
| lines | ≥ 70% |
| functions | ≥ 70% |
| statements | ≥ 70% |
| branches | ≥ 55% |

---

## 十、用例编写指导（guide 指令）

### 10.1 指令格式

```bash
@skill kuikly-test guide
```

触发该指令后，输出本文档**第六节（用例编写规范）**和**第七节（KuiklyPage Fixture API）**的完整内容，作为编写新测试用例的参考。

### 10.2 常见问题

**Q: 截图基准存储在哪里？**
A: `web-e2e/tests/{level}/{path}.spec.ts-snapshots/` 目录下，文件名格式为 `{name}-chromium-win32.png`（根据 OS 和浏览器自动区分）。

**Q: 如何更新截图基准？**
A: 本地运行 `npx playwright test --update-snapshots`，确认截图变化符合预期后再 commit。不要在 CI 中自动更新基准。

**Q: 截图对比失败怎么排查？**
A: 运行 `cd web-e2e && npx playwright show-report reports/html` 打开 Playwright HTML 报告，可以直观看到实际/期望/差异截图对比。

**Q: 新增组件后如何添加测试？**
A: 使用 `@skill kuikly-test generate <TestPageName>` 自动生成，然后运行 `--update-snapshots` 生成初始基准。

**Q: 为什么用 `data-kuikly-component` 而不是 CSS 类名定位？**
A: CSS 类名可能随构建变化，`data-kuikly-component` 由渲染层代码稳定注入，与 Kotlin 组件类型直接对应，语义清晰且不受样式重构影响。

**Q: `waitForRenderComplete` 做了什么？**
A: 等待网络 idle（确保资源加载完毕）+ 100ms 稳定等待（确保渲染管线 flush），足以覆盖绝大多数渲染场景。

**Q: 如何运行单个测试文件？**
A: `cd web-e2e && npx playwright test tests/L1-simple/click.spec.ts`

**Q: 如何以有界面模式调试？**
A: `cd web-e2e && npx playwright test --headed --debug`，或 `npm run test:ui` 打开 Playwright UI 模式。

---

## 十一、全自动闭环（auto 指令）

### 11.1 指令格式

```bash
@skill kuikly-test auto
```

触发后 AI **全程自主执行**，无需人工介入，直到所有测试通过且覆盖率达标，最后输出一份完整的执行报告。

---

### 11.2 完整执行流程

```
Phase A：用例完整性检查
       ↓
Phase B：运行全量测试
       ↓
Phase C：失败用例修复（循环直到通过）
       ↓
Phase D：覆盖率检查与补充（循环直到达标）
       ↓
Phase E：输出最终报告
```

---

### 11.3 Phase A — 用例完整性检查

**目标：** 确保每个 web_test 测试页面都有对应的 spec 文件，不遗漏任何组件/场景。

**Step A1：扫描所有 web_test 页面**

读取目录 `demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/` 下的全部 `.kt` 文件，建立「页面清单」：

```
当前已知的 25 个测试页面（基准，如有新增则自动追加）：

components/（L0）
  KRCanvasViewTestPage   → web-e2e/tests/L0-static/components/krcanvas.spec.ts
  KRGradientRichTextTestPage → web-e2e/tests/L0-static/components/krgradientrichtext.spec.ts
  KRImageViewTestPage    → web-e2e/tests/L0-static/components/krimage.spec.ts
  KRListViewTestPage     → web-e2e/tests/L0-static/components/krlist.spec.ts
  KRRichTextViewTestPage → web-e2e/tests/L0-static/components/krrichtext.spec.ts
  KRScrollContentViewTestPage → web-e2e/tests/L0-static/components/krscrollcontent.spec.ts
  KRTextViewTestPage     → web-e2e/tests/L0-static/components/krtext.spec.ts
  KRViewTestPage         → web-e2e/tests/L0-static/components/krview.spec.ts

styles/（L0）
  BorderTestPage         → web-e2e/tests/L0-static/styles/border.spec.ts
  GradientTestPage       → web-e2e/tests/L0-static/styles/gradient.spec.ts
  OpacityTestPage        → web-e2e/tests/L0-static/styles/opacity.spec.ts
  OverflowTestPage       → web-e2e/tests/L0-static/styles/overflow.spec.ts
  ShadowTestPage         → web-e2e/tests/L0-static/styles/shadow.spec.ts
  TransformTestPage      → web-e2e/tests/L0-static/styles/transform.spec.ts

interactions/（L1/L2）
  ClickTestPage          → web-e2e/tests/L1-simple/click.spec.ts
  InputTestPage          → web-e2e/tests/L1-simple/input.spec.ts
  ModalTestPage          → web-e2e/tests/L1-simple/modal.spec.ts
  ListScrollTestPage     → web-e2e/tests/L2-complex/listscroll.spec.ts
  GestureTestPage        → web-e2e/tests/L2-complex/gesture.spec.ts
  NavigationTestPage     → web-e2e/tests/L2-complex/navigation.spec.ts

animations/（L2）
  CSSTransitionTestPage  → web-e2e/tests/L2-complex/animations/css-transition.spec.ts
  JSFrameAnimTestPage    → web-e2e/tests/L2-complex/animations/js-frame-anim.spec.ts
  PropertyAnimTestPage   → web-e2e/tests/L2-complex/animations/property-anim.spec.ts

composite/（L1/L2）
  SearchTestPage         → web-e2e/tests/L2-complex/search.spec.ts
  FormTestPage           → web-e2e/tests/L2-complex/form.spec.ts
```

**Step A2：检查每个页面是否有对应 spec 文件**

对比「页面清单」与实际 `web-e2e/tests/` 中存在的 spec 文件：

- 若 spec 文件**存在** → 标记为 ✅，继续
- 若 spec 文件**不存在** → 标记为 ❌ 缺失，进入 **Step A3**

**Step A3：自动补生成缺失的 spec 文件**

对每个 ❌ 缺失的页面，执行与 `generate` 指令完全相同的流程（见第四节）：
1. 读取对应 `.kt` 源码
2. 查询第五节「组件交互特征知识库」
3. 生成完整 `.spec.ts` 文件并写入正确路径
4. 记录"已补生成"列表，供最终报告使用

**Step A4：为新生成的 spec 文件建立截图基准**

新 spec 文件中有 `toHaveScreenshot()` 调用，首次运行前需要生成基准：

```bash
cd web-e2e
npx playwright test <新生成的spec文件路径> --update-snapshots
```

对每个新生成的文件依次执行，确保基准就绪后再进入 Phase B。

---

### 11.4 Phase B — 运行全量测试

**Step B1：执行全量测试，收集原始结果**

```bash
cd web-e2e
npx playwright test --reporter=json > /tmp/pw-results.json
```

同时用 `list` reporter 输出到控制台，供 AI 实时解析。

**Step B2：解析结果，按失败类型分类**

从测试输出中提取所有失败用例，按以下类型归类：

| 类型代码 | 判断依据 | 含义 |
|----------|---------|------|
| `SCREENSHOT_DIFF` | 错误信息含 `pixels are different` 或 `Screenshot comparison failed` | 截图与基准不符 |
| `ELEMENT_NOT_FOUND` | 错误信息含 `Timeout` + `locator` 或 `waiting for` | 元素定位失败 |
| `ASSERTION_FAILED` | 错误信息含 `expect(` + `toBe` / `toHaveText` 等 | 断言值与预期不符 |
| `PAGE_CRASH` | 错误信息含 `crashed` 或 `net::ERR` | 页面加载/崩溃错误 |
| `UNKNOWN` | 其他 | 未知错误 |

**Step B3：若全部通过 → 跳转 Phase D（覆盖率检查）**

**Step B4：若有失败 → 进入 Phase C（失败修复）**

---

### 11.5 Phase C — 失败用例修复

对 Phase B 分类出的每种失败类型，采用对应的修复策略，**修复后重新运行该 spec 文件**验证是否通过，通过才算完成修复。

#### C1：SCREENSHOT_DIFF — 截图差异

**判断逻辑：**

首先判断截图差异的来源：

1. **读取该 spec 文件对应的测试页面 `.kt` 源码**，检查页面内容是否发生了变化（组件新增/删除/样式调整）
2. **检查 git 状态**（`git diff` 或 `git log`），判断该 `.kt` 文件或相关渲染代码是否有近期改动

**修复策略：**

| 情况 | 操作 |
|------|------|
| 页面/渲染代码**有改动**，截图差异属于**预期变化** | 更新截图基准：`npx playwright test <spec文件> --update-snapshots` |
| 页面/渲染代码**无改动**，截图差异是**意外变化** | 不更新基准，将此用例加入「待人工确认」列表，继续处理其他问题 |

#### C2：ELEMENT_NOT_FOUND — 元素定位失败

**判断逻辑：**

1. 读取失败用例代码，提取定位表达式（`component()`、`getByText()` 等）
2. 读取对应测试页面的 `.kt` 源码，检查该元素是否仍然存在于页面结构中

**修复策略：**

| 情况 | 操作 |
|------|------|
| 页面中**已删除或重命名**该元素 | 更新 spec 文件：修改定位表达式或移除已失效的用例块 |
| 页面中**存在该元素**，但定位不精确 | 更新 spec 文件：参照第六节「元素定位优先级」改写定位方式 |
| 页面内容**未发生变化**，疑似渲染时序问题 | 在该步骤前增加 `await kuiklyPage.waitForRenderComplete()` |

#### C3：ASSERTION_FAILED — 断言值不符

**判断逻辑：**

1. 提取失败断言的期望值（`expected`）和实际值（`received`）
2. 读取对应测试页面 `.kt` 源码，确认页面当前实际输出的文本/状态

**修复策略：**

| 情况 | 操作 |
|------|------|
| 页面文本/逻辑已**有意修改** | 更新 spec 文件中的期望值 |
| 期望值写错了（spec 文件 bug） | 修正 spec 文件中的期望值 |
| 实际值是**渲染 Bug** | 将此用例加入「待人工确认」列表，记录详细的实际值 vs 期望值 |

#### C4：PAGE_CRASH — 页面崩溃

**修复策略：**

1. 用 `kuiklyPage.goto()` 单独访问该测试页面的 URL
2. 检查 Playwright 控制台错误输出（`page.on('console')`）
3. 若是已知的测试页面 URL 格式错误，修正 spec 文件中的 `goto()` 参数
4. 若无法自动定位原因，加入「待人工确认」列表

#### C5：循环验证

每种类型修复完成后，单独重新运行该 spec 文件：

```bash
cd web-e2e
npx playwright test <修复的spec文件>
```

- 通过 → 标记为已修复，继续处理下一个
- 仍失败 → 最多重试修复 **2 次**，2 次后加入「待人工确认」列表，继续处理其他问题

**「待人工确认」列表不阻塞后续流程**，AI 继续处理其他失败用例和覆盖率检查，最终在报告中统一呈现。

---

### 11.6 Phase D — 覆盖率检查与补充

**覆盖率收集完全自动化**：`test-base.ts` fixture teardown 已在每个测试结束后自动调用 `collectCoverage()`，将 `window.__coverage__` 写入 `.nyc_output/`。AI 只需按以下步骤操作，**无需手动干预，无需两个终端**。

---

**Step D1：停止普通服务器（若已在运行），插桩并启动插桩服务器**

```bash
# 1. 检查 8080 端口是否被占用（普通服务器）
#    Windows：
powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 8080 -State Listen).OwningProcess | Select-Object Id,ProcessName"
#    macOS/Linux：
lsof -ti:8080

# 2. 如有进程占用 8080，停止它
#    Windows：
powershell -Command "Stop-Process -Id <PID> -Force"
#    macOS/Linux：
kill -9 <PID>

# 3. 执行插桩
cd web-e2e
npm run instrument

# 4. 后台启动插桩服务器（Playwright 的 reuseExistingServer: true 会自动复用它）
#    Windows Git Bash / macOS / Linux：
node scripts/serve-instrumented.mjs &

# 等待服务器启动（验证 200 响应）
sleep 2
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
```

**Step D2：运行全量测试，收集覆盖率数据**

```bash
cd web-e2e
npx playwright test --reporter=list
```

覆盖率数据自动写入 `.nyc_output/*.json`（每个测试一个文件，共 159 个）。

**Step D3：生成覆盖率报告并检查阈值**

```bash
cd web-e2e
npm run coverage          # 生成 HTML/text 报告
npm run coverage:check    # 检查阈值（lines/functions/statements ≥ 70%，branches ≥ 55%）
```

读取 text 报告输出，提取各指标数值：

```
File      | % Stmts | % Branch | % Funcs | % Lines
h5App.js  |  87.5   |   50.0   |  100.0  |  91.3
```

**Step D4：若全部达标 → 进入 Phase E（输出报告）**

**Step D5：若有指标不达标 → 定位覆盖率低的区域**

从 `reports/coverage/index.html` 或 `.nyc_output/*.json` 文件中，找出覆盖率最低的函数区域：

1. 读取 `.nyc_output/` 下任意一个 JSON 文件（所有文件记录相同文件，只是计数器不同，nyc 会合并）
2. 找出 `f`（function）计数器中值为 0 的函数，即未执行的代码路径
3. 对照 `fnMap` 找到对应的函数名和行号，判断属于哪个渲染组件

**Step D6：针对低覆盖区域补充用例**

对识别出的低覆盖组件，检查该组件的测试页面中是否存在**未被现有 spec 覆盖的场景**：

1. 读取该组件对应的 `web_test` 页面 `.kt` 源码
2. 对照「组件交互特征知识库」（第五节），检查是否有必须验证的交互操作在现有 spec 中**缺失**
3. 若发现缺失场景 → 在现有 spec 文件中**追加对应的 test 块**
4. 追加后重新执行 Step D2～D3，更新覆盖率数据

**Step D7：循环检查，直到达标**

- 达标 → 进入 Phase E
- 仍不达标 → 重复 Step D5~D6，最多循环 **3 次**
- 3 次后仍不达标 → 在报告中说明剩余缺口，列入「待人工处理」

---

### 11.7 Phase E — 输出最终报告

所有 Phase 执行完毕后，输出如下结构的报告：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Kuikly Web E2E 自动化运行报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【用例完整性】Phase A
  扫描 web_test 页面：25 个
  ✅ 已有 spec 文件：25 个
  🆕 本次新补生成：0 个（或列出新生成文件名）

【测试运行结果】Phase B/C
  初始运行：XX passed / XX failed
  自动修复：XX 个用例（列出每个修复动作）
  最终结果：XX passed / 0 failed ✅
  待人工确认：X 个（若有，列出用例名 + 失败原因摘要）

【覆盖率】Phase D
  lines:      XX%  ✅（≥70%）
  functions:  XX%  ✅（≥70%）
  statements: XX%  ✅（≥70%）
  branches:   XX%  ✅（≥55%）
  本次新增用例：X 个（列出追加的 test 块）

【变更文件汇总】
  修改：
    - web-e2e/tests/xxx/xxx.spec.ts（修改原因）
  新增：
    - web-e2e/tests/xxx/xxx.spec.ts（新增原因）
  截图基准更新：
    - tests/xxx/xxx.spec.ts-snapshots/xxx.png

【需要人工处理的项目】（若有）
  1. [用例名]：[原因] — [AI 的判断依据]
  2. ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 11.8 执行约束与边界条件

| 约束 | 说明 |
|------|------|
| **截图基准更新须有依据** | 只有在确认页面或渲染代码有改动时才更新基准，不得无理由更新 |
| **不删除现有测试** | 即使用例失败，也不删除用例，只修改或追加，删除操作须人工确认 |
| **修复重试上限** | 每个失败用例最多自动修复 2 次，超限进入「待人工确认」列表 |
| **覆盖率补充循环上限** | 最多循环 3 次，避免无限追加 |
| **新生成用例须通过验证** | 补生成或追加的用例必须实际运行通过后才计入「已修复」 |
| **PAG 动画用例保持 skip** | `pag-anim.spec.ts` 中的全部 skip 用例不处理，不计入失败 |
