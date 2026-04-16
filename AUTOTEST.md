# KuiklyUI Web 自动化测试方案

> 本文档为 kuikly-web（`core-render-web` + `h5App`）模块的自动化测试体系设计方案。  
> 确认无误后将按阶段实施。

---

## 目录

- [1. 总体目标](#1-总体目标)
- [2. 整体架构](#2-整体架构)
- [3. 专用测试页面（web-test）](#3-专用测试页面web-test)
  - [3.1 为什么不直接使用现有 Demo 页面](#31-为什么不直接使用现有-demo-页面)
  - [3.2 web-test 目录结构](#32-web-test-目录结构)
  - [3.3 测试页面设计原则](#33-测试页面设计原则)
  - [3.4 测试页面分类清单](#34-测试页面分类清单)
  - [3.5 测试页面生成策略](#35-测试页面生成策略)
- [4. 渲染层改动：注入 data-kuikly-component](#4-渲染层改动注入-data-kuikly-component)
- [5. web-e2e 测试目录结构](#5-web-e2e-测试目录结构)
- [6. 交互用例自动化设计原则](#6-交互用例自动化设计原则)
  - [6.1 核心理念：生成即完整，执行零介入](#61-核心理念生成即完整执行零介入)
  - [6.2 组件交互特征知识库](#62-组件交互特征知识库component-interaction-profile)
  - [6.3 交互步骤描述协议](#63-交互步骤描述协议interaction-protocol)
  - [6.4 交互场景自动化策略](#64-交互场景自动化策略)
  - [6.5 批量执行能力 runSteps()](#65-kuiklypage-提供的批量执行能力)
  - [6.6 元素定位策略优先级](#66-元素定位策略优先级)
  - [6.7 自动等待与容错机制](#67-自动等待与容错机制)
- [7. 分级测试用例集](#7-分级测试用例集)
  - [7.1 L0 — 静态渲染（无交互）](#71-l0--静态渲染无交互)
  - [7.2 L1 — 简单交互（点击/输入）](#72-l1--简单交互点击输入)
  - [7.3 L2 — 复杂交互（滑动/手势/动画/跳转）](#73-l2--复杂交互滑动手势动画跳转)
- [8. 动画测试方案](#8-动画测试方案)
- [9. 核心 Fixture：KuiklyPage](#9-核心-fixturekuiklypage)
- [10. Playwright 配置](#10-playwright-配置)
- [11. CLI 统一入口](#11-cli-统一入口)
- [12. 代码覆盖率](#12-代码覆盖率)
- [13. CI/CD 集成（蓝盾，待落地）](#13-cicd-集成蓝盾待落地)
- [14. CodeBuddy Skill 设计](#14-codebuddy-skill-设计)
- [15. 实施计划](#15-实施计划)
- [16. 待确认项](#16-待确认项)

---

## 1. 总体目标

| 目标           | 说明                                                                 |
| -------------- | -------------------------------------------------------------------- |
| **功能覆盖**   | 覆盖全部 Web 渲染组件、CSS 样式、Module 的渲染与交互验证             |
| **分级体系**   | L0（无交互截图） / L1（点击输入） / L2（滑动手势动画跳转）三级用例   |
| **截图对比**   | 像素级截图对比（Playwright `toHaveScreenshot()`），不禁用动画         |
| **覆盖率**     | 以 NYC 官方 Kotlin 文件覆盖率结果为准：对 Kotlin/JS 运行产物执行 Istanbul 插桩，并通过 source map 反向映射为 Kotlin 源文件覆盖率 |
| **运行方式**   | CLI 本地一键闭环执行（构建 → 插桩 → 启动插桩服务器 → 执行用例 → 收集覆盖率 → 生成/检查 NYC 官方 Kotlin 文件覆盖率报告）；CI 侧应复用同一 CLI 入口 |
| **AI 辅助**    | CodeBuddy Skill 支持一键运行、用例编写指导、AI 自动生成 E2E 用例     |

---

## 2. 整体架构

```
┌───────────────────────────────────────────────────┐
│                 Skill Layer                        │
│   CodeBuddy Skill (一键运行 / 编写指导 / AI生成)    │
├───────────────────────────────────────────────────┤
│                  CLI Layer                         │
│   kuikly-test.mjs                                 │
│   编排: gradle构建 → 启动插桩服务器 → 执行测试       │
│         → 收集覆盖率 → 生成 NYC 官方 Kotlin 文件覆盖率报告 │
├───────────────────────────────────────────────────┤
│            Test Framework Layer                    │
│   Playwright + @playwright/test                   │
│   ┌─────────┬─────────┬──────────┐               │
│   │ L0 静态  │ L1 简单  │ L2 复杂   │               │
│   └─────────┴─────────┴──────────┘               │
│   KuiklyPage Fixture (封装渲染等待/组件定位/滚动)    │
├───────────────────────────────────────────────────┤
│             Coverage Layer                         │
│   Istanbul 插桩 Kotlin/JS 产物                     │
│   NYC 官方 Kotlin 文件覆盖率报告 + 阈值门禁            │
└───────────────────────────────────────────────────┘
```

**数据流：**

```
web-test 测试页面 (demo/src/commonMain/kotlin/.../pages/web_test/)
       ↓ Gradle KMP 编译
nativevue2.js (仅含测试页面业务代码)
h5App.js      (含完整渲染引擎：core-render-web/base + core-render-web/h5)
       ↓ Istanbul 插桩 → instrumented/
       ↓ Koa 静态服务器提供插桩后的文件
h5App 宿主页面 (index.html 加载 h5App.js + nativevue2.js)
       ↓ 浏览器渲染
DOM (div + absolute 定位 + data-kuikly-component 属性)
       ↓ Playwright 控制浏览器
截图对比 / DOM 断言 / 交互验证 / window.__coverage__ 覆盖率收集
```

---

## 3. 专用测试页面（web-test）

### 3.1 为什么不直接使用现有 Demo 页面

现有 `demo/src/commonMain` 中有 250+ 个 Demo 页面，存在以下问题：

| 问题               | 说明                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| **页面杂乱**       | Demo 页面是开发过程中随意添加的，命名不统一、功能重叠、布局不规范               |
| **覆盖不全**       | 有些渲染组件/交互模式没有对应的 Demo 页面，有些 Demo 同时混合了太多功能        |
| **不可控**         | Demo 页面可能随业务需求随时变更，导致截图基准频繁失效，测试结果不稳定           |
| **不利于定位**     | 多个组件混在一个页面中，一旦截图对比失败，难以精确定位是哪个组件出了问题        |
| **与测试解耦**     | Demo 的目标是「演示功能」，测试页面的目标是「精确验证渲染正确性」，两者职责不同  |

**因此，我们在 demo 内新建 `web_test` 目录，按渲染组件和模块分类，专门为自动化测试生成测试页面。** 测试页面是测试的专属资源，内容可控、结构稳定、覆盖完整。

### 3.2 web-test 目录结构

```
demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/
├── components/     # 渲染组件测试页面（如 KRViewTestPage.kt、KRImageViewTestPage.kt）
├── styles/         # CSS 样式测试页面（如 BorderTestPage.kt、GradientTestPage.kt）
├── interactions/   # 交互行为测试页面（如 ClickTestPage.kt、ModalTestPage.kt、PageListTestPage.kt）
├── animations/     # 动画测试页面（如 CSSTransitionTestPage.kt、PAGAnimTestPage.kt）
├── composite/      # 组合场景测试页面（如 SearchTestPage.kt、FormTestPage.kt）
└── modules/        # Module 测试页面（如 CalendarModuleTestPage.kt、NetworkModuleTestPage.kt）
```

> **说明：** 上面只保留分类与代表性示例，避免页面清单随仓库演进而在文档中漂移。完整页面列表与页面/spec 对应关系请以 `node kuikly-web-autotest/scripts/scan-web-test-pages.mjs` 输出为准。

### 3.3 测试页面设计原则

| 原则                     | 说明                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------- |
| **单一职责**             | 每个测试页面只验证**一种组件或一种样式**，便于精确定位问题                                 |
| **内容确定性**           | 页面使用硬编码的固定数据（文本、图片 URL、列表项数），不依赖网络请求或动态数据             |
| **布局稳定**             | 页面布局固定不变，确保截图基准长期有效                                                    |
| **命名规范**             | 统一使用 `{组件/样式名}TestPage` 命名，如 `KRListViewTestPage`、`BorderTestPage`          |
| **完整覆盖**             | 每个测试页面覆盖该组件/样式的**所有变体**（如 KRTextView 要包含不同字号、颜色、对齐方式等）|
| **无外部依赖**           | 测试页面不调用网络接口、不读取本地数据库，所有数据内嵌在页面中                             |
| **可独立访问**           | 每个测试页面有独立的路由，可通过 URL 直接打开                                              |
| **唯一页面来源**         | `web-e2e/tests/` 中所有 `kuiklyPage.goto()` 只能指向 `demo/.../pages/web_test/` 下注册的测试页面；禁止直接依赖普通 Demo 页面 |
| **缺页先补页**           | 若现有 `web_test` 中没有可承载某项测试属性的页面，必须先在 `web_test` 内新建测试页面，再生成或修改对应 spec |

### 3.4 测试页面分类示例（非穷举）

> **说明：** 本节用于说明各类页面承担的测试职责，只保留代表性页面。当前完整页面清单请以 `scan-web-test-pages.mjs` 的扫描结果为准。

#### 3.4.1 L0 — 静态渲染测试页面

| 测试页面                        | 验证目标                                           | 页面内容说明                                      |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| `KRViewTestPage`               | KRView 基础渲染                                    | 不同尺寸/背景色/圆角的 View 组合                   |
| `KRTextViewTestPage`           | 文本渲染                                           | 不同字号/颜色/对齐/多行/截断/行高的文本            |
| `KRRichTextViewTestPage`       | 富文本渲染                                         | 多种 Span 样式（粗体/颜色/链接/图片混排）          |
| `KRGradientRichTextTestPage`   | 渐变富文本渲染                                     | 渐变色文本效果                                     |
| `KRImageViewTestPage`          | 图片渲染                                           | 不同尺寸/缩放模式/圆角/placeholder 的图片          |
| `KRCanvasViewTestPage`         | Canvas 绘制                                        | 线段/圆形/矩形/贝塞尔曲线/渐变填充                |
| `BorderTestPage`               | border / borderRadius                              | 不同宽度/颜色/圆角组合                              |
| `ShadowTestPage`               | shadow                                             | 不同偏移/模糊/颜色的阴影                            |
| `GradientTestPage`             | gradient                                           | 线性渐变/径向渐变/多色渐变                          |
| `TransformTestPage`            | transform                                          | rotate/scale/translate/skew 组合                    |
| `OpacityTestPage`              | opacity                                            | 不同透明度值                                        |
| `OverflowTestPage`             | overflow                                           | hidden/visible/scroll 各模式                        |

#### 3.4.2 L1 — 简单交互测试页面

| 测试页面                        | 验证目标                                           | 页面内容说明                                      |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| `ClickTestPage`                | 点击事件                                            | 按钮+Tab 切换+开关+复选框                          |
| `InputTestPage`                | 输入交互                                            | 文本输入框+密码框+多行输入+最大长度限制             |
| `ModalTestPage`                | 弹窗交互                                            | 触发按钮+对话框+底部弹窗+弹窗内交互                |

#### 3.4.3 L2 — 复杂交互测试页面

| 测试页面                        | 验证目标                                           | 页面内容说明                                      |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| `ListScrollTestPage`           | 列表滚动                                            | 固定 50 项列表 + stickyHeader + 可点击项           |
| `GestureTestPage`              | 手势操作                                            | 水平翻页容器 + 可拖拽元素                          |
| `CSSTransitionTestPage`        | CSS Transition 动画                                 | 点击触发 transition 的元素                         |
| `JSFrameAnimTestPage`          | JS 帧动画                                           | requestAnimationFrame 驱动的动画元素               |
| `PropertyAnimTestPage`         | KR 属性动画                                         | Kotlin/JS 驱动的属性变化                           |
| `PAGAnimTestPage`              | PAG 动画                                            | PAG 文件渲染到 Canvas                              |
| `NavigationTestPage`           | 页面跳转                                            | 跳转触发按钮 + 目标子页面 + 返回                   |
| `SearchTestPage`               | 组合场景                                            | 搜索框 + 搜索按钮 + 结果列表                       |
| `FormTestPage`                 | 组合场景                                            | 多个输入框 + 开关 + 提交按钮                        |

### 3.5 测试页面生成策略

测试页面由 **AI（CodeBuddy Skill）自动生成**，流程如下：

```
┌──────────────────────────────────────────────────────┐
│  1. 分析 6.2 组件交互特征知识库                         │
│     确定需要测试的所有渲染组件和样式类型                  │
└────────────────────┬─────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────┐
│  2. 为每个组件/样式生成对应的测试页面                    │
│     - 使用硬编码数据，覆盖该组件的所有变体              │
│     - 遵循测试页面设计原则（3.3 节）                    │
│     - 统一命名：{组件名}TestPage.kt                     │
└────────────────────┬─────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────┐
│  3. AI Review 生成的测试页面                            │
│     - 读取实际组件 Kotlin 源码，核查 API 调用是否正确   │
│     - 检查页面是否覆盖了该组件的所有关键变体            │
│     - 对照 3.3 节设计原则检查页面结构                   │
│     - 发现问题则自动修正，修正后重新执行本步骤           │
│     ✅ 默认由 AI 完成并自动回写修正；                    │
│        若 AI 校验后仍存在无法闭环的问题，再升级为人工处理 │
└────────────────────┬─────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────┐
│  4. 注册路由                                           │
│     每个测试页面注册独立路由，格式如：                   │
│     http://localhost:8080?page_name=KRListViewTestPage    │
│     http://localhost:8080?page_name=BorderTestPage        │
│     http://localhost:8080?page_name=ClickTestPage         │
└────────────────────┬─────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────┐
│  5. 生成对应的 E2E 测试用例                             │
│     每个测试页面 → 一个或多个 .spec.ts 测试文件          │
│     测试中通过路由访问对应的 web-test 测试页面           │
└──────────────────────────────────────────────────────┘
```

> **核心价值：** 测试页面与 Demo 页面完全解耦。Demo 随业务需求自由变更，测试页面保持稳定。新增渲染组件或样式时，只需在 `web_test` 中新增对应的测试页面即可。

### 3.6 测试页面来源约束

为保证自动化测试稳定性，页面来源必须遵守以下硬性约束：

1. `web-e2e/tests/` 中所有通过 `kuiklyPage.goto('<PageName>')` 访问的页面，必须来自 `demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/`。
2. 禁止直接复用普通 Demo 页面、示例页、业务页作为正式 E2E 测试入口，即使这些页面当前可用。
3. 如果某个现有 spec 依赖的页面不在 `web_test` 内，则该 spec 必须整改：
   - 若 `web_test` 已有等价测试页面，则将 spec 切换到该页面。
   - 若 `web_test` 中没有满足该测试目标的页面，则先补建新的 `web_test` 测试页面，再让 spec 指向新页面。
4. AI Skill 在执行 `generate`、`auto`、补覆盖率、补缺失用例时，均必须先检查页面是否位于 `web_test`；若不在，则优先补页面，不得继续基于普通 Demo 页面生成正式用例。

---

## 4. 渲染层改动：注入 data-kuikly-component

### 4.1 背景

Kuikly Web 渲染的 DOM 结构全部是 `<div>` + `position: absolute` 定位，无法通过语义化标签识别组件类型。为了让自动化测试能够**精准定位组件**（如列表容器、图片、文本等），需要在渲染层为每个 DOM 元素注入 `data-kuikly-component` 属性。

### 4.2 改动文件

```
core-render-web/base/src/jsMain/kotlin/com/tencent/kuikly/core/render/web/layer/KuiklyRenderLayerHandler.kt
```

### 4.3 改动位置

在 `createRenderViewHandler` 方法中，元素创建完成后，为其设置 `data-kuikly-component` 属性：

```kotlin
// 在 createRenderViewHandler 方法中，renderViewHandler 创建完成后、设置 id 之前或之后
// 注入 data-kuikly-component 属性，标识组件类型
renderViewHandler.viewExport.ele.setAttribute("data-kuikly-component", viewName)
```

具体位置在 `createRenderViewHandler` 方法的以下代码块之后（约第 368 行附近）：

```kotlin
// 现有代码：设置 id 便于问题排查
if (renderViewHandler.viewExport.ele.id == "") {
    renderViewHandler.viewExport.ele.id = "${instanceId}_${tag}"
}

// >>> 新增：注入组件类型属性，供自动化测试定位 <<<
renderViewHandler.viewExport.ele.setAttribute("data-kuikly-component", viewName)
```

### 4.4 效果

改动后 DOM 结构示例：

```html
<!-- 改动前 -->
<div id="1_5" style="position:absolute; left:0px; top:0px; width:375px; height:44px;">
  <div id="1_6" style="position:absolute; ...">文本内容</div>
</div>

<!-- 改动后 -->
<div id="1_5" data-kuikly-component="KRView" style="position:absolute; left:0px; top:0px; width:375px; height:44px;">
  <div id="1_6" data-kuikly-component="KRTextView" style="position:absolute; ...">文本内容</div>
</div>
```

### 4.5 测试中的使用方式

```typescript
// 通过 data-kuikly-component 属性精准定位组件
const listContainers = page.locator('[data-kuikly-component="KRListView"]');
const images = page.locator('[data-kuikly-component="KRImageView"]');
const textViews = page.locator('[data-kuikly-component="KRTextView"]');
const scrollViews = page.locator('[data-kuikly-component="KRScrollView"]');
```

### 4.6 影响评估

| 维度         | 评估                                                         |
| ------------ | ------------------------------------------------------------ |
| **性能影响** | setAttribute 调用开销极小，对渲染性能无可感知影响             |
| **兼容性**   | `data-*` 属性是 HTML5 标准，所有浏览器兼容                    |
| **包大小**   | 增加的代码不超过 1 行，对产物大小无影响                       |
| **已有功能** | 不改变任何已有逻辑，纯新增属性                                |

---

## 5. web-e2e 测试目录结构

```
web-e2e/
├── package.json              # npm 依赖 (playwright, nyc, etc.)
├── playwright.config.js      # Playwright 配置（CommonJS 格式）
├── .nycrc.json               # Istanbul/NYC 覆盖率配置
├── tsconfig.json             # TypeScript 配置
│
├── fixtures/
│   ├── kuikly-page.ts        # KuiklyPage Fixture（核心封装）
│   └── test-base.ts          # 扩展 test 对象，注入 Fixture
│
├── scripts/
│   └── kuikly-test.mjs       # CLI 统一入口脚本
│
├── tests/
│   ├── L0-static/            # L0：静态渲染截图对比（含 components/styles/smoke）
│   ├── L1-simple/            # L1：简单交互、modules 与部分 managed auto spec
│   └── L2-complex/           # L2：复杂交互、composite、animations 与部分 managed auto spec
│
├── *.spec.ts-snapshots/      # 截图基准文件（git 跟踪）
│   │                         # Playwright 默认将基准图存储在各 spec 同级目录
│   │                         # 命名格式：{name}-chromium-win32.png
│   │                         # 完整 spec 清单以 `web-e2e/tests/` 当前目录为准
│
└── reports/                  # 生成的报告（.gitignore）
    ├── html/                 # Playwright HTML 报告
    └── coverage/             # NYC 官方 Kotlin 文件覆盖率报告
```

---

## 6. 交互用例自动化设计原则

### 6.1 核心理念：生成即完整，执行零介入

自动化测试的「零人工介入」包含两个层面：这里的“零人工”指默认执行路径不依赖人工补步骤或人工单独启动服务；若规则缺失、页面异常或 AI 无法自动修正，仍允许升级为人工处理。

```
┌──────────────────────────────────────────────────────────────────┐
│  层面一：用例生成零介入                                            │
│  AI 分析 web-test 测试页面中使用的组件类型 → 自动推导需要哪些交互操作       │
│  → 自动生成包含完整交互步骤的用例代码                               │
│  ❌ 不需要人发现"这里还缺一个滑动操作"再补充                        │
│  ✅ 生成出来就已经包含了该组件需要验证的所有交互                     │
├──────────────────────────────────────────────────────────────────┤
│  层面二：用例执行零介入                                            │
│  用例从打开页面到验证结果，全流程自动执行                            │
│  ❌ 不需要人工操作任何一步                                          │
│  ✅ 完全可重复、无人值守、CI 自动运行                               │
└──────────────────────────────────────────────────────────────────┘
```

**关键原则：** 如果页面渲染出了 `KRListView`，那么生成的用例**必须**包含滚动操作；如果渲染出了 `KRInputView`，那么生成的用例**必须**包含输入操作。这不应该由人去发现遗漏并补充，而是在用例生成阶段就由 **「组件交互特征知识库」** 自动推导出来。

### 6.2 组件交互特征知识库（Component Interaction Profile）

为了让 AI 在生成用例时**自动推导出该组件需要哪些交互操作**，我们建立一个「组件交互特征知识库」。AI 分析 web-test 测试页面渲染出的 DOM 结构，通过 `data-kuikly-component` 属性识别底层渲染组件类型，然后查表获取该组件必须验证的交互清单。

> **说明：** 知识库以**底层渲染组件**（`KRXxxView`）为维度，不涉及 Compose 层组件。因为自动化测试验证的是 Web 渲染层的正确性，DOM 上能看到的只有 `KRXxxView` 类型。

#### 6.2.1 渲染组件 → 必须验证的交互操作映射表

| 渲染组件（`data-kuikly-component`）| **必须自动包含的交互操作**                                                                     | 测试级别 |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| `KRView`                          | ① 静态渲染截图 ② 如有点击行为：点击→验证状态变化 ③ 如有手势：拖拽/缩放→验证效果                  | L0/L1/L2 |
| `KRTextView`                      | ① 静态渲染截图（验证文本内容、样式正确）                                                        | L0       |
| `KRRichTextView`                  | ① 静态渲染截图（验证富文本样式）② 如有可点击 Span：点击→验证跳转/效果                            | L0/L1    |
| `KRGradientRichTextView`          | ① 静态渲染截图（验证渐变富文本渲染正确）                                                        | L0       |
| `KRImageView`                     | ① 等待图片加载完成 ② 截图验证（渲染正确、无白图/破图）                                           | L0       |
| `KRListView`                      | ① 垂直/水平滚动（根据方向属性判断）→ 每步截图 ② 滚动到边界 ③ 列表项点击（如有 clickable 子元素）④ 如有 stickyHeader：验证吸顶 ⑤ 如有分页（paging）：滑动翻页→验证每页内容 | L2       |
| `KRScrollContentView`             | ① 垂直/水平滚动 → 每步截图 ② 滚动到边界验证                                                    | L2       |
| `KRTextFieldView` / `KRInputView` | ① 点击获取焦点 ② 输入文本 ③ 验证显示 ④ 清空重新输入 ⑤ 点击外部失去焦点                          | L1       |
| `KRCanvasView`                    | ① 静态截图验证绘制正确                                                                          | L0       |
| `KRVideoView`                     | ① 等待视频加载 ② 截图验证首帧渲染（不验证播放流程）                                              | L0       |
| `KRModalView`                     | ① 触发弹出 ② 截图弹窗 ③ 弹窗内交互 ④ 关闭弹窗 ⑤ 截图确认关闭                                   | L1       |

#### 6.2.2 AI 推导流程

当 AI 需要为一个 web-test 测试页面生成测试用例时，按以下流程自动推导交互操作：

```
┌──────────────────────────────────────────────┐
│  1. 打开 web-test 测试页面，解析 DOM 结构     │
│     识别所有 data-kuikly-component 属性值      │
│     （或分析测试页面源码推断渲染出的组件类型） │
└───────────────────┬──────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│  2. 匹配「组件交互特征知识库」                  │
│     KRListView  → 优先补齐滚动操作              │
│     KRInputView → 优先补齐输入操作              │
│     KRView (有点击) → 优先补齐点击操作          │
│     KRModalView → 优先补齐弹出/关闭操作         │
│     ... 查表获取完整的交互清单                   │
└───────────────────┬──────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│  3. 合并交互清单 + 确定测试级别                 │
│     单个页面可能包含多种渲染组件                 │
│     → 取所有组件交互的并集                      │
│     → 级别取最高（L2 > L1 > L0）               │
└───────────────────┬──────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│  4. 生成完整用例代码                            │
│     L0 部分: 初始渲染截图                       │
│     L1 部分: 点击/输入/切换操作 + 截图           │
│     L2 部分: 滚动/滑动/手势/动画操作 + 截图      │
│     每个操作步骤都包含等待和截图验证              │
└──────────────────────────────────────────────┘
```

#### 6.2.3 举例说明

以 `web_test/interactions/SearchTestPage` 测试页面为例，渲染后的 DOM 结构：

```html
<div data-kuikly-component="KRView">            <!-- 页面容器 -->
  <div data-kuikly-component="KRInputView">      <!-- 搜索框 -->
  <div data-kuikly-component="KRListView">       <!-- 结果列表 -->
    <div data-kuikly-component="KRView">         <!-- 列表项 (可点击) -->
      <div data-kuikly-component="KRImageView">  <!-- 图标 -->
      <div data-kuikly-component="KRTextView">   <!-- 标题 -->
    </div>
    ...
  </div>
</div>
```

**AI 自动推导结果：**

| 识别到的渲染组件        | 查表获得的必须交互                                  |
| ---------------------- | -------------------------------------------------- |
| `KRInputView`          | 点击获取焦点 → 输入文本 → 验证显示                   |
| `KRListView`           | 垂直滚动 × 多次 + 截图                              |
| `KRView` (列表项)       | 点击列表项 + 验证状态变化                            |
| `KRImageView`          | 等待加载 + 截图验证                                  |
| `KRTextView`           | 初始渲染截图                                        |

**生成的用例自动包含：**

```typescript
test('SearchTestPage full interaction', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=SearchTestPage');
  await kuiklyPage.waitForRenderComplete();

  // [L0] 初始渲染验证
  await expect(kuiklyPage.page).toHaveScreenshot('search-initial.png');

  // [L1 - 来自 KRInputView] 输入交互
  const input = kuiklyPage.component('KRInputView').first();
  await input.click();
  await input.fill('test keyword');
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('search-input.png');

  // [L2 - 来自 KRListView] 垂直滚动
  const list = kuiklyPage.component('KRListView').first();
  await kuiklyPage.scrollInContainer(list, { deltaY: 300 });
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('search-scroll-1.png');

  // [L1 - 来自 KRView 列表项] 点击列表项
  await kuiklyPage.component('KRView').nth(3).click();
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('search-item-clicked.png');
});
// 注释: 以上交互步骤默认由 AI 根据渲染组件类型和知识库规则自动推导生成
```

> **核心价值：** 有了这个知识库，AI 在识别到 `KRListView`、`KRInputView` 等渲染组件后，会按预定义规则补齐对应的滚动、输入等主要交互步骤。知识库用于降低遗漏风险，并把人工介入收敛到规则缺失或页面本身异常的场景。

### 6.3 交互步骤描述协议（Interaction Protocol）

为了让每个交互用例都能 **自描述** 其完整交互流程，我们定义标准化的交互步骤协议：

```typescript
/** 交互步骤类型 */
type InteractionStep =
  | { action: 'click';     target: TargetSelector }
  | { action: 'input';     target: TargetSelector; text: string }
  | { action: 'scroll';    target: TargetSelector; deltaX?: number; deltaY?: number }
  | { action: 'swipe';     target: TargetSelector; direction: Direction; distance: number }
  | { action: 'drag';      from: TargetSelector; to: TargetSelector }
  | { action: 'longPress'; target: TargetSelector; duration?: number }
  | { action: 'wait';      ms: number }
  | { action: 'waitForRender' }
  | { action: 'snapshot';  name: string }       // 在此步骤截图对比
  | { action: 'assert';    fn: AssertFn }        // 自定义断言

/** 组件定位方式 */
type TargetSelector =
  | { component: string; nth?: number }           // data-kuikly-component 定位
  | { id: string }                                // 元素 id 定位
  | { text: string }                              // 文本内容定位
  | { position: { x: number; y: number } }        // 坐标定位（兜底方案）

type Direction = 'up' | 'down' | 'left' | 'right';
```

### 6.4 交互场景自动化策略

针对不同交互场景，预定义标准化的自动化交互方案：

#### 6.4.1 点击交互

```typescript
// ✅ 预编排方式：明确定位目标 + 明确验证预期
test('Tab switching', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=ClickTestPage');
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('tab-initial.png');

  // 点击第 2 个 Tab（通过 nth 精确定位）
  await kuiklyPage.component('KRView').nth(1).click();
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('tab-second-selected.png');

  // 点击第 3 个 Tab
  await kuiklyPage.component('KRView').nth(2).click();
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('tab-third-selected.png');
});
```

#### 6.4.2 输入交互

```typescript
test('KRInputView input and display', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=InputTestPage');
  await kuiklyPage.waitForRenderComplete();

  // 定位输入框并输入预定文本
  const input = kuiklyPage.component('KRInputView').first();
  await input.click();
  await kuiklyPage.page.keyboard.type('Hello Kuikly', { delay: 50 });
  await kuiklyPage.waitForRenderComplete();

  // 验证输入后的视觉效果
  await expect(kuiklyPage.page).toHaveScreenshot('textfield-after-input.png');
});
```

#### 6.4.3 列表滚动

```typescript
test('KRListView scroll reveals more items', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=ListScrollTestPage');
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('list-top.png');

  // 预定义：分 3 次滚动，每次验证
  const list = kuiklyPage.component('KRListView').first();

  await kuiklyPage.scrollInContainer(list, { deltaY: 300 });
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('list-scroll-1.png');

  await kuiklyPage.scrollInContainer(list, { deltaY: 300 });
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('list-scroll-2.png');

  await kuiklyPage.scrollInContainer(list, { deltaY: 300 });
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('list-scroll-3.png');
});
```

#### 6.4.4 手势操作

```typescript
test('Swipe gesture triggers page change', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=GestureTestPage');
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('pager-page-1.png');

  // 预定义：向左滑动切换到第 2 页
  const pager = kuiklyPage.component('KRListView').first();
  await kuiklyPage.swipeInContainer(pager, { direction: 'left', distance: 300 });
  await kuiklyPage.waitForAnimationEnd();
  await expect(kuiklyPage.page).toHaveScreenshot('pager-page-2.png');

  // 继续向左滑动切换到第 3 页
  await kuiklyPage.swipeInContainer(pager, { direction: 'left', distance: 300 });
  await kuiklyPage.waitForAnimationEnd();
  await expect(kuiklyPage.page).toHaveScreenshot('pager-page-3.png');
});
```

#### 6.4.5 页面跳转

```typescript
test('Navigation push and pop', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=NavigationTestPage');
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('nav-home.png');

  // 点击跳转到详情页
  await kuiklyPage.component('KRView').nth(0).click();
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('nav-detail.png');

  // 点击返回按钮回到首页
  await kuiklyPage.component('KRView').nth(0).click();
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('nav-back-home.png');
});
```

#### 6.4.6 组合交互场景

```typescript
test('Search: input + click + scroll result list', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=SearchTestPage');
  await kuiklyPage.waitForRenderComplete();

  // Step 1: 输入搜索关键词
  const searchInput = kuiklyPage.component('KRInputView').first();
  await searchInput.click();
  await kuiklyPage.page.keyboard.type('Kuikly');

  // Step 2: 点击搜索按钮
  const searchBtn = kuiklyPage.component('KRView').nth(1);
  await searchBtn.click();
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('search-results.png');

  // Step 3: 滚动结果列表查看更多
  const resultList = kuiklyPage.component('KRListView').first();
  await kuiklyPage.scrollInContainer(resultList, { deltaY: 500 });
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('search-results-scrolled.png');
});
```

### 6.5 KuiklyPage 提供的批量执行能力

对于步骤较多的复杂场景，`KuiklyPage` 还提供 `runSteps()` 方法，支持以声明式数据描述整个交互流程，一次性自动执行：

```typescript
test('Complex multi-step interaction', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=FormTestPage');
  await kuiklyPage.waitForRenderComplete();

  // 声明式描述交互流程，框架按顺序自动执行
  await kuiklyPage.runSteps([
    { action: 'snapshot',  name: 'step-0-initial.png' },
    { action: 'click',     target: { component: 'KRView', nth: 0 } },
    { action: 'waitForRender' },
    { action: 'snapshot',  name: 'step-1-after-click.png' },
    { action: 'input',     target: { component: 'KRInputView', nth: 0 }, text: 'test' },
    { action: 'waitForRender' },
    { action: 'snapshot',  name: 'step-2-after-input.png' },
    { action: 'scroll',    target: { component: 'KRListView', nth: 0 }, deltaY: 500 },
    { action: 'waitForRender' },
    { action: 'snapshot',  name: 'step-3-after-scroll.png' },
  ]);
});
```

### 6.6 元素定位策略优先级

由于 Kuikly Web DOM 全是 `<div>` + absolute 定位，元素定位采用以下优先级策略：

| 优先级 | 定位方式                             | 适用场景                       | 示例                                    |
| ------ | ------------------------------------ | ------------------------------ | --------------------------------------- |
| **1**  | `data-kuikly-component` + `nth`      | 同类型组件取第 N 个             | `component('KRView').nth(2)`            |
| **2**  | 元素 `id` 属性                       | 需要精确到某个特定元素          | `page.locator('#1_5')`                  |
| **3**  | 文本内容匹配                         | 含有可见文本的元素              | `page.getByText('确认')`               |
| **4**  | 坐标定位                             | 无法通过属性区分时的兜底方案    | `page.click({ x: 187, y: 400 })`       |

> **设计目标：** 80% 以上的交互用例使用优先级 1 即可完成定位，只有极少数特殊场景需要降级到优先级 3-4。

### 6.7 自动等待与容错机制

为确保交互用例在不同机器/网络环境下都能稳定执行，`KuiklyPage` 内建以下自动等待机制：

| 机制                            | 说明                                                             |
| ------------------------------- | ---------------------------------------------------------------- |
| **渲染完成等待**                | 每次交互后调用 `waitForRenderComplete()`，等待 Kuikly 渲染管线 idle |
| **动画结束等待**                | `waitForAnimationEnd()` 等待所有 transition/animation 完成         |
| **元素可见等待**                | Playwright 内建：click/input 等操作自动等待元素可见可交互          |
| **网络空闲等待**                | 可配置等待网络请求完成（图片加载等）                                |
| **超时 + 重试**                 | Playwright config 中 `timeout: 60s` + `retries: 1`                |

---

## 7. 分级测试用例集

### 7.1 L0 — 静态渲染（无交互）

**目标：** 验证渲染组件和 CSS 样式的渲染输出是否正确，通过截图对比检测视觉回归。

**覆盖范围：**

| 类别              | 示例组件/测试页面                                                                 |
| ----------------- | --------------------------------------------------------------------------------- |
| **基础组件**      | KRView, KRImageView, KRTextView, KRRichTextView, KRGradientRichTextView, ...       |
| **列表组件**      | KRListView（静态列表，不滚动）                                                     |
| **画布组件**      | KRCanvasView                                                                       |
| **CSS 样式**      | border, borderRadius, shadow, gradient, opacity, transform, overflow, ...          |

**用例模式：**

```typescript
test('KRImageView renders correctly', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=KRImageViewTestPage');
  await kuiklyPage.waitForRenderComplete();
  await expect(kuiklyPage.page).toHaveScreenshot('image-view-test.png');
});
```

### 7.2 L1 — 简单交互（点击/输入）

**目标：** 验证点击、输入等基础交互事件的响应正确性。每个用例的交互步骤完全预编排。

**覆盖范围：**

| 交互类型     | 测试页面                             | 预编排步骤                                        | 验证点                             |
| ------------ | ------------------------------------ | ------------------------------------------------ | ---------------------------------- |
| **点击**     | ClickTestPage                        | 定位目标组件 → click → 等待渲染 → 截图             | 点击后视觉状态变化                 |
| **输入**     | InputTestPage                        | 定位KRInputView → click聚焦 → keyboard.type → 截图 | 输入文本后显示正确                 |
| **切换**     | ClickTestPage（开关/复选框区域）      | 定位KRView → click切换 → 截图 → 再click → 截图     | 开关状态正确切换                   |
| **弹窗**     | ModalTestPage                        | 定位触发按钮 → click弹出 → 截图 → 关闭弹窗 → 截图  | 弹窗内容正确、关闭后恢复           |

### 7.3 L2 — 复杂交互（滑动/手势/动画/跳转）

**目标：** 验证滚动列表、手势操作、动画效果、页面路由跳转等复杂场景。所有交互步骤完全预编排。

**覆盖范围：**

| 交互类型     | 测试页面                                         | 预编排步骤                                              | 验证点                               |
| ------------ | ------------------------------------------------ | ------------------------------------------------------ | ------------------------------------ |
| **列表滚动** | ListScrollTestPage                               | 定位KRListView → scrollInContainer分步滚动 → 逐步截图     | 滚动后内容正确展示                   |
| **手势**     | GestureTestPage                                  | 定位容器 → swipeInContainer指定方向/距离 → 等待动画 → 截图 | 手势后元素/页面状态变化               |
| **动画**     | CSSTransitionTestPage, PropertyAnimTestPage       | 截初态 → 触发 → captureAnimationFrames → 截终态            | 动画过程帧间有差异 + 终态正确        |
| **页面跳转** | NavigationTestPage                               | click跳转 → 等待渲染 → 截图 → click返回 → 截图             | 跳转内容正确、返回状态保持           |

---

## 8. 动画测试方案

### 8.1 Kuikly Web 动画类型

| 类型               | 实现方式                                         | 测试策略                              |
| ------------------ | ------------------------------------------------ | ------------------------------------- |
| **CSS Transition** | `transition` + style 变更触发                     | 监听 `transitionend` + 关键帧截图      |
| **PAG 动画**       | PAG SDK 渲染到 Canvas                             | 定时截图序列，验证帧间差异             |
| **JS 帧动画**      | `requestAnimationFrame` 回调驱动                   | 定时截图序列，验证帧间差异             |
| **KR 属性动画**    | Kotlin/JS 驱动的属性变化动画                         | 触发状态 → 定时截图 → 终态截图对比      |

### 8.2 核心策略：定时截图序列 + 关键帧断言

**不禁用动画**，而是通过以下三步验证动画正确性：

```
1. 初始截图 → 捕获动画前状态
2. 触发动画 → 在动画过程中采集截图序列（captureAnimationFrames）
3. 终态截图 → 动画结束后对比基准截图
```

### 8.2.1 CI 稳定性风险与备选策略

> **风险：** CI 机器资源负载不稳定时，动画时序会有偏差，导致截图在不一致的帧上触发，造成误报。

针对不同动画类型，提供两种策略供选择：

| 动画类型 | 首选策略 | 备选策略（CI 不稳定时降级使用） |
| -------- | -------- | ------------------------------ |
| **CSS Transition** | 监听 `transitionend` 事件后截终态图 | `getComputedStyle` 验证属性终态值（不依赖截图时序） |
| **KR 属性动画** | 触发 → 等待终态 → 截图 | `page.evaluate()` 读取元素最终 style 值进行断言 |
| **JS 帧动画** | 定时截图序列验证帧间差异 | 暂停 rAF（`page.evaluate(() => cancelAnimationFrame(...))`）后截图固定帧 |
| **PAG 动画** | 定时截图序列 | 验证 Canvas 非全透明（证明有渲染输出），不做像素精确对比 |

**CSS Transition 备选策略示例：**

```typescript
// 不依赖截图时序，直接验证 CSS 属性终态
const el = kuiklyPage.component('KRView').first();
await trigger.click();
await kuiklyPage.waitForTransitionEnd(el);

// 用计算样式断言终态，完全不受 CI 时序影响
const opacity = await kuiklyPage.getComputedStyles(el, ['opacity']);
expect(opacity.opacity).toBe('1');
```

> **规则：** L2 动画测试默认使用首选策略；在 CI 环境中（`process.env.CI === 'true'`）自动降级到备选策略以提升稳定性。

### 8.3 用例示例

```typescript
test('KRView fade-in animation', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('?page_name=CSSTransitionTestPage');
  await kuiklyPage.waitForRenderComplete();

  // 1. 初始状态截图
  await expect(kuiklyPage.page).toHaveScreenshot('anim-visibility-initial.png');

  // 2. 触发动画（点击触发元素可见性切换）
  const trigger = kuiklyPage.component('KRView').first();
  await trigger.click();

  // 3. 采集动画帧序列（每 100ms 截一帧，最多 2 秒）
  const frames = await kuiklyPage.captureAnimationFrames({
    interval: 100,
    maxDuration: 2000,
  });

  // 4. 验证动画渐变性：帧之间应存在差异（说明在动画中）
  expect(frames.length).toBeGreaterThan(3);
  const diffCount = kuiklyPage.countFrameDiffs(frames, { threshold: 0.005 });
  expect(diffCount).toBeGreaterThan(1); // 至少有 2 帧不同

  // 5. 终态截图对比
  await kuiklyPage.waitForAnimationEnd();
  await expect(kuiklyPage.page).toHaveScreenshot('anim-visibility-final.png');
});
```

### 8.4 动画辅助方法（KuiklyPage Fixture 提供）

| 方法                          | 说明                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `captureAnimationFrames(opt)` | 按 `interval` ms 间隔截图，直到 `maxDuration` ms 或动画结束   |
| `waitForAnimationEnd()`       | 等待所有进行中的 CSS transition/animation 结束                |
| `waitForTransitionEnd(el)`    | 等待指定元素的 transitionend 事件                             |
| `countFrameDiffs(frames, opt)`| 比较帧序列中相邻帧的差异数量                                  |
| `framesDiffer(a, b, opt)`     | 比较两帧截图是否存在视觉差异                                  |
| `getComputedStyles(el, props)`| 获取元素的计算样式值，验证动画中间状态                         |

---

## 9. 核心 Fixture：KuiklyPage

`KuiklyPage` 是所有测试用例的核心工具类，封装了 Kuikly Web 特有的操作：

```typescript
class KuiklyPage {
  constructor(private page: Page) {}

  // ==================== 导航与等待 ====================
  
  /** 导航到指定测试页面，使用格式：'?page_name=TestPageName' */
  async goto(pageName: string): Promise<void>;
  
  /** 等待 Kuikly 渲染完成（监听特定标志或 idle 状态） */
  async waitForRenderComplete(timeout?: number): Promise<void>;

  // ==================== 组件定位 ====================

  /** 通过 data-kuikly-component 属性定位组件，返回 Locator（可链式调用） */
  component(type: string): Locator;
  // 用法: kuiklyPage.component('KRListView').first()

  /** 获取所有同类型组件，返回 Locator[]（可遍历） */
  async components(type: string): Promise<Locator[]>;

  /** 获取当前页面的组件树结构（调试用） */
  async getComponentTree(): Promise<ComponentNode[]>;

  // ==================== 滚动操作 ====================
  
  /** 获取页面中所有可滚动容器 */
  async getScrollContainers(): Promise<Locator[]>;
  
  /** 在指定容器内滚动（调用 element.scrollTo） */
  async scrollInContainer(
    container: Locator, 
    options: { deltaX?: number; deltaY?: number; smooth?: boolean }
  ): Promise<void>;
  
  /** 在指定容器内执行滑动手势 */
  async swipeInContainer(
    container: Locator,
    options: { direction: 'up' | 'down' | 'left' | 'right'; distance: number }
  ): Promise<void>;

  // ==================== 动画操作 ====================
  
  /** 采集动画帧截图序列 */
  async captureAnimationFrames(options: {
    interval: number;       // 截图间隔 (ms)
    maxDuration: number;    // 最大采集时长 (ms)
  }): Promise<Buffer[]>;
  
  /** 等待所有 CSS transition/animation 结束 */
  async waitForAnimationEnd(): Promise<void>;
  
  /** 等待指定元素的 transitionend 事件 */
  async waitForTransitionEnd(locator: Locator): Promise<void>;

  // 注意：waitForAnyTransitionEnd() 暂未实现，如需可使用 waitForAnimationEnd() 替代
  
  /** 获取元素的计算样式 */
  async getComputedStyles(
    locator: Locator, 
    properties: string[]
  ): Promise<Record<string, string>>;
  
  /** 比较两帧截图是否有视觉差异 */
  framesDiffer(a: Buffer, b: Buffer, options?: { threshold?: number }): boolean;
  
  /** 统计帧序列中相邻帧的差异数量 */
  countFrameDiffs(frames: Buffer[], options?: { threshold?: number }): number;

  // ==================== 批量交互执行（预留扩展）====================

  // runSteps() 方法暂未实现，作为后续扩展预留。
  // 当前请使用逐步调用各操作方法（click / scroll / swipe 等）的方式编写用例。
}
```

---

## 10. Playwright 配置

```javascript
// web-e2e/playwright.config.js（CommonJS 格式）
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 1,

  // 截图对比配置
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,     // 允许 2% 像素差异（当前实现值）
      threshold: 0.2,              // 单像素颜色容差
      // 注意：不设置 animations: 'disabled'，保留动画
    },
  },

  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 375, height: 812 },  // iPhone X 尺寸
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } },
    },
    // Kuikly Web 主要面向移动端 H5，暂只用 Chromium
  ],

  // 本地调试单轮用例时，Playwright 可自动启动 node scripts/serve.js（port 8080）
  // 日常标准入口仍应优先使用 kuikly-test.mjs --full
  // reuseExistingServer: true，已有服务器会被直接复用
  webServer: {
    command: 'node scripts/serve.js',
    port: 8080,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
```

---

## 11. CLI 统一入口

### 11.1 设计目标

CLI 必须满足“本地一键运行”原则：开发者执行一条命令后，由脚本自行完成构建、插桩、启动插桩服务器、执行 Playwright、收集覆盖率、生成 NYC 官方 Kotlin 文件覆盖率报告与阈值检查，不要求用户手动再开第二个终端，也不依赖人工确认中间步骤。

### 11.2 脚本位置

```
web-e2e/scripts/kuikly-test.mjs
```

### 11.3 命令接口

```bash
# 完整流程：构建 → 插桩 → 启动插桩服务器 → 测试 → 覆盖率 → 阈值检查
node web-e2e/scripts/kuikly-test.mjs --full

# 仅运行指定级别用例
node web-e2e/scripts/kuikly-test.mjs --level L0
node web-e2e/scripts/kuikly-test.mjs --level L1
node web-e2e/scripts/kuikly-test.mjs --level L2

# 运行指定用例文件
node web-e2e/scripts/kuikly-test.mjs --test tests/L0-static/components/krimage.spec.ts

# 更新截图基准
node web-e2e/scripts/kuikly-test.mjs --update-snapshots

# 仅生成 NYC 官方 Kotlin 文件覆盖率报告
node web-e2e/scripts/kuikly-test.mjs --coverage-only

# 仅执行插桩
node web-e2e/scripts/kuikly-test.mjs --instrument

# 跳过构建（使用已有产物）
node web-e2e/scripts/kuikly-test.mjs --skip-build --level L0
```

### 11.4 执行流程

```
┌─────────────────────────┐
│  1. 解析 CLI 参数        │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  2. Gradle 构建产物      │  --skip-build 可跳过
│  demo + h5App           │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  3. Istanbul 插桩        │
│  h5App.js / nativevue2.js│
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  4. 启动插桩静态服务      │
│  自动拉起/复用 8080 端口  │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  5. 执行 Playwright 测试  │  按 --level / --test 过滤
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  6. 收集 __coverage__    │  fixture 自动导出到 .nyc_output/
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  7. 生成 NYC 官方 Kotlin    │
│     NYC 官方 Kotlin 文件覆盖率报告并执行阈值检查 │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  8. 输出测试结果与 NYC 官方 Kotlin 文件覆盖率报告 │
└─────────────────────────┘
```

> **说明：** CLI 编排应始终围绕“零手工介入”设计；如果需要插桩服务器，必须由 CLI 自行启动或可靠复用，而不是要求使用者手动准备环境。

---

## 12. 代码覆盖率

### 12.1 覆盖率口径

本方案的覆盖率口径统一为：**以 NYC 官方 Kotlin 文件覆盖率结果作为唯一门禁与对外展示口径，并以 Kotlin 源文件维度解读结果**。

- 插桩对象仍然是 Kotlin/JS 编译产物，主要是 `h5App.js`，必要时可包含 `nativevue2.js`。
- 覆盖率采集来源仍然是浏览器运行期间的 `window.__coverage__`。
- 最终用于门禁、文档、CI 展示的结果，统一表述为“NYC 官方 Kotlin 文件覆盖率结果”。
- 辅助脚本若存在，只作为兼容层或排障工具，不单独定义为正式覆盖率口径。

### 12.2 插桩目标

| 产物文件         | 来源                                          | 说明                                                         | 插桩优先级 |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------ | ---------- |
| `h5App.js`       | `h5App` + `core-render-web/base` + `core-render-web/h5` 打包 | **主要插桩目标**，包含完整渲染引擎代码（组件渲染、样式计算、事件处理、动画等核心路径） | ⭐ 必须 |
| `nativevue2.js`  | `demo` 编译（web-test 测试页面）               | 辅助插桩目标，只包含测试页面业务代码，**不含渲染引擎**；可用于补充观测测试页面逻辑，但不作为渲染引擎覆盖率主口径 | 可选 |

> **注意：** `core-render-web/base` 和 `core-render-web/h5` 的代码通过 Gradle 依赖被打包进 `h5App.js`，不会出现在 `nativevue2.js` 中。因此渲染引擎覆盖率的主口径必须以 `h5App.js` 对应的 NYC 报告为准。

### 12.3 NYC 配置

```json
// web-e2e/.nycrc.json
{
  "all": false,
  "exclude": [
    "**/*.spec.js",
    "**/*.test.js",
    "**/node_modules/**",
    "**/test/**",
    "**/tests/**"
  ],
  "reporter": ["text", "html", "lcov", "json"],
  "report-dir": "reports/coverage",
  "temp-dir": ".nyc_output",
  "sourceMap": true,
  "check-coverage": true,
  "lines": 70,
  "functions": 70,
  "statements": 70,
  "branches": 55
}
```

> **`"sourceMap": true` 说明：** NYC 读取 `.js.map` 文件，将 JS 级别的覆盖数据反向映射回 Kotlin 源文件，最终以 Kotlin 源文件维度解释覆盖率。

### 12.4 覆盖率阈值

当前统一门禁阈值：

| 指标 | 阈值 |
| ---- | ---- |
| lines | 70% |
| functions | 70% |
| statements | 70% |
| branches | 55% |

长期目标：在核心渲染路径上继续提高阈值，但文档中的正式门禁口径以当前 `.nycrc.json` 实际配置为准。

### 12.5 覆盖率收集流程

1. **构建产物：** CLI 调用 Gradle 构建 `h5App.js` 及其 source map。
2. **插桩产物：** CLI 调用插桩脚本，对 `h5App.js` 执行 Istanbul 插桩；必要时可同时处理 `nativevue2.js`，统一输出到 `instrumented/` 目录。
3. **启动插桩服务器：** CLI 自动启动或复用插桩版静态服务，对外提供 `instrumented/` 中的产物文件。
4. **运行时收集：** 浏览器执行测试时，插桩代码持续写入 `window.__coverage__`。
5. **自动导出：** `test-base.ts` fixture teardown 自动调用 `collectCoverage()`，将每个测试的覆盖率数据写入 `.nyc_output/`。
6. **生成 NYC 官方 Kotlin 文件覆盖率报告：** 由 NYC 基于 `.nyc_output/` 和 source map 生成 HTML/text/lcov/json 报告到 `reports/coverage/`。
7. **阈值检查：** 由 NYC 基于 `.nycrc.json` 进行覆盖率门禁检查。

### 12.6 输出约定

- `npm run coverage` 与 CLI 覆盖率步骤的目标应指向 NYC 官方 Kotlin 文件覆盖率报告。
- 文档、CI 报表、Skill 输出中的“覆盖率”默认均指 NYC 官方 Kotlin 文件覆盖率结果，不再混用“JS 摘要”“自定义 Kotlin 汇总”“笼统 NYC 官方报告”三套说法。
- 若为兼容 Windows 路径问题而保留辅助脚本，应明确其职责是“为 NYC 官方流程服务的兼容封装”，而不是替代 NYC 口径。

---

## 13. CI/CD 集成（蓝盾，待落地）

> **现状说明：** 本节描述的是目标态 CI 方案。当前仓库尚未提交实际蓝盾 Pipeline 配置，现阶段请以本地 CLI（`web-e2e/scripts/kuikly-test.mjs --full`）和闭环入口（`kuikly-web-autotest/scripts/run-autotest-loop.mjs`）作为事实来源。

### 13.1 触发策略

| 触发条件                             | 执行级别   | 说明                        |
| ------------------------------------ | ---------- | --------------------------- |
| `core-render-web/**` 变更            | L0 + L1 + L2 | 渲染层改动，全量回归              |
| `h5App/**` 变更                      | L0 + L1    | 宿主层改动，基础回归              |
| `compose/**` 变更                    | L0 + L1    | 框架层改动，渲染组件回归          |
| `demo/**/web_test/**` 变更           | L0 + L1 + L2 | 测试页面改动，全量回归          |
| 定时触发（每日/每周）                 | L0 + L1 + L2 | 全量回归                       |

### 13.2 蓝盾 Pipeline 配置要点

```yaml
# 伪代码表示蓝盾流水线配置
stages:
  - name: "环境准备"
    steps:
      - checkout
      - install Node.js 18+
      - npm ci (web-e2e/)
      - npx playwright install chromium

  - name: "执行自动化测试"
    steps:
      - node web-e2e/scripts/kuikly-test.mjs --full --level ${LEVEL}
    env:
      CI: true

  - name: "收集报告"
    steps:
      - archive web-e2e/reports/html/
      - archive web-e2e/reports/coverage/
      - archive web-e2e/tests/**/**/*.spec.ts-snapshots/ (失败时，如流水线支持 glob 则按此模式归档)

  - name: "质量门禁"
    steps:
      - 以 NYC 官方 Kotlin 文件覆盖率结果执行阈值检查
      - 截图对比失败数 == 0
```

> **要求：** CI 应尽量复用与本地一致的 CLI 一键入口，避免再在流水线中拆分出与本地行为不一致的“构建/插桩/启动插桩服务器/测试”手工步骤，防止本地与 CI 两套流程逐步漂移。

### 13.3 截图基准管理

- 截图基准文件按 Playwright 默认规则存储在各 spec 同级的 `*.spec.ts-snapshots/` 目录，**纳入 Git 版本管理**
- CI 中如果截图对比失败，报告中会展示 diff 图片便于排查
- **基准生成规则：** 开发者本地执行 `npm run test:update-snapshots` 生成基准并 commit。通过 Chrome 启动参数（方案一）+ 内嵌 Web Font（方案二）消除跨平台字体渲染差异，无需在 CI 或 Docker 中专门生成
- **基准更新流程：**
  1. 执行 `npm run setup` 确认字体已下载（消除字体差异）
  2. 本地运行 `npm run test:update-snapshots` 生成截图
  3. 肉眼 review `git diff tests/` 确认截图变化符合预期
  4. `git add tests/ && git commit -m "chore: update snapshots"`
- **基准失效处理：** 渲染层改动导致基准合理变化时，走上述更新流程；如果是误报，检查 `maxDiffPixelRatio`（当前 `0.02`）是否需要调整

---

## 14. CodeBuddy Skill 设计

### 14.1 Skill 功能

> **当前事实来源：** 本仓库的 Skill 说明与默认运行方式以 `kuikly-web-autotest/SKILL.md` 为准，配套元数据位于 `kuikly-web-autotest/agents/openai.yaml`。

| 能力             | 说明                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| **一键运行**     | 通过 `kuikly-web-autotest/SKILL.md` 驱动闭环入口 `node kuikly-web-autotest/scripts/run-autotest-loop.mjs` |
| **编写指导**     | 以 `kuikly-web-autotest/SKILL.md` 中的 workflow、decision rules、safe mutation scope 为准 |
| **AI 自动生成**  | 由闭环执行器根据 completeness / coverage 自动生成或刷新 managed `auto-*.spec.ts` |
| **覆盖率查看**   | 通过 `summarize-coverage.mjs` / `build-autotest-report.mjs` 查看 NYC Kotlin 覆盖率摘要 |

#### 推荐触发 Prompt（可直接复制）

以下 Prompt 适合直接发给 CodeBuddy，用来稳定触发 `kuikly-web-autotest` 的当前默认工作流。

1. **完整回归**

   ```text
   请按 kuikly-web-autotest 的标准闭环跑一轮 web autotest，并汇总测试、coverage、自动修复和阻塞项。
   ```

2. **继续推进**

   ```text
   请继续 kuikly-web-autotest 闭环，优先修失败项和 coverage 未达标问题，并在安全修复范围内自动推进。
   ```

3. **单点修复**

   ```text
   请只重跑并修复这个 spec：<spec 路径>。跳过 build，修完后复验，并告诉我是否需要回到完整闭环。
   ```

4. **只看报告**

   ```text
   请先不要重跑，先读取 web-e2e/reports/autotest/loop-report.json，分析当前状态、阻塞项和下一步建议。
   ```

### 14.2 AI 自动生成流程

当前仓库的实际闭环入口已经不是“单页 generate spec”的线性流程，而是以 `kuikly-web-autotest/scripts/run-autotest-loop.mjs` 为入口的多轮闭环执行器。下面这版流程图用于替换旧参考图，反映当前实现中的真实节点与分支。

```text
开发/AI
  ↓
SKILL
  kuikly-web-autotest
  ↓
CLI 闭环入口
  node kuikly-web-autotest/scripts/run-autotest-loop.mjs
  ↓
预扫描 / 预修复
  - scan-web-test-pages.mjs
  - 补齐缺失 managed spec
  - 修复并验证少量可安全修复的 handwritten spec
  ↓
是否允许带缺口继续
  ├─ 否，且 completeness 不通过
  │   → 输出 warnings + loop-report.json
  │   → 结束
  └─ 是 / completeness 通过
      ↓
  Canonical CLI
    node web-e2e/scripts/kuikly-test.mjs --full
      ↓
  CLI 内部编排
    - build（可 skip）
    - instrument
    - start instrumented server
    - Playwright 执行
    - generate coverage report
    - check coverage thresholds
      ↓
  结果分析
    - analyze-playwright-results.mjs
    - summarize-coverage.mjs
    - suggest-test-targets.mjs
      ↓
  用例结果是否通过
  ├─ 不通过
  │   ↓
  │ 安全自动修复范围内？
  │   ├─ 是
  │   │   - repair managed spec failures
  │   │   - repair handwritten spec（仅确定性规则）
  │   │   - targeted rerun verify
  │   │   ↓
  │   │  仍有轮次预算？
  │   │   ├─ 是 → 回到 Canonical CLI 再跑一轮
  │   │   └─ 否 → 输出 warnings + loop-report.json → 结束
  │   └─ 否
  │       → 标记 manual review / product issue warning
  │       → 输出 loop-report.json
  │       → 结束
  └─ 通过
      ↓
  覆盖率是否达标
  ├─ 达标
  │   → finalStatus.overallPassed = true
  │   → 输出 loop-report.json
  │   → 结束
  └─ 不达标
      ↓
  是否存在清晰可补的 coverage spec / carrier page
  ├─ 是
  │   - addManagedSpecsForCoverage
  │   - 必要时补最小可判定的 web_test carrier page
  │   ↓
  │  仍有轮次预算？
  │   ├─ 是 → 回到 Canonical CLI 再跑一轮
  │   └─ 否 → 输出未达标 warnings + loop-report.json → 结束
  └─ 否
      → 标记 carrier-page blocker / manual review
      → 输出 loop-report.json
      → 结束
```

**与旧参考图的关键差异：**

- 当前实际入口是 `run-autotest-loop.mjs`，而不是直接从 Skill 调 `kuikly-test.mjs` 后由人工决定下一步。
- `CLI` 之后不是只接 `Playwright`；真实链路还包含 build、instrument、instrumented server、coverage report 与 threshold check。
- “用例结果”和“覆盖率”之间确实仍然是串联关系，但两者外侧各自都有自动修复和多轮重试逻辑，不是单轮判断。
- “是否需要人工决策”在当前实现里不是一个单独前置菱形，而是散落在多个阻断点：completeness gap、handwritten repair 验证失败、product issue、carrier-page blocker、轮次耗尽。
- 当前结束态以 `web-e2e/reports/autotest/loop-report.json` 的 `finalStatus`、`warnings`、`actions` 为准，而不是只看某一次 Playwright 执行结果。

**当前实现对应关系：**

- 闭环入口：`kuikly-web-autotest/scripts/run-autotest-loop.mjs`
- Canonical CLI：`web-e2e/scripts/kuikly-test.mjs --full`
- 浏览器执行层：`Playwright` + `web-e2e/playwright.config.js`
- 结果分析：`analyze-playwright-results.mjs`、`summarize-coverage.mjs`、`suggest-test-targets.mjs`
- 机器可读输出：`web-e2e/reports/autotest/loop-report.json`

**关键设计：** 当前核心已经从“根据单个页面生成一份 spec”升级为“扫描 completeness → 跑 canonical CLI → 分析失败与覆盖率 → 在安全边界内自动修复/补测 → 多轮收敛”。因此文档里后续若再描述 Skill 流程，应优先围绕闭环执行器，而不是围绕旧版 generate-only 模型。

### 14.3 Skill 文件

当前仓库以 `kuikly-web-autotest/SKILL.md` 作为 Skill 说明与发现入口，`kuikly-web-autotest/agents/openai.yaml` 提供配套元数据。当前实现**不再以** `.codebuddy/rules/kuikly-test.md` 作为事实来源，后续文档描述也应统一引用仓内 `SKILL.md`。

`kuikly-web-autotest/SKILL.md` 当前包含：

- 项目上下文（Kuikly Web 架构说明）
- **组件交互特征知识库**（渲染组件 `KRXxxView` → 必须验证的交互操作映射表，来自 6.2 节）
- Fixture API 文档
- 用例编写规范与模板
- 命名约定（文件名、截图名）
- web-test 测试页面设计原则（来自 3.3 节）
- web-test 唯一页面来源约束与缺页先补页规则（来自 3.6 节）
- 闭环执行默认命令、分析脚本入口、自动修复边界与升级人工处理规则

---

## 15. 实施计划

### Phase 1：基础设施搭建 ✅ **已完成**

- [x] 渲染层改动：`KuiklyRenderLayerHandler.kt` 注入 `data-kuikly-component`
- [x] 创建 `web-e2e/` 目录结构
- [x] 初始化 `package.json`、`playwright.config.js`、`tsconfig.json`
- [x] 实现 `KuiklyPage` Fixture 核心方法（goto, waitForRenderComplete, component）
- [x] 编写 1 个 L0 冒烟测试验证流程打通
- [x] 额外完成：创建本地测试服务器（当前主入口为 `web-e2e/scripts/serve.js`）
- [x] 额外完成：编写快速启动指南（`web-e2e/QUICKSTART.md`）

**验证步骤：** 见 [web-e2e/QUICKSTART.md](./web-e2e/QUICKSTART.md)

### Phase 2：web-test 测试页面生成 ✅ **已完成**

- [x] 在 `demo/src/commonMain/.../pages/` 下创建 `web_test/` 目录结构
- [x] 清理现有对非 `web_test` 页面（普通 Demo 页面/示例页/业务页）的 E2E 依赖；完整性以 `node kuikly-web-autotest/scripts/scan-web-test-pages.mjs` 的扫描结果为准，当前扫描结论为无缺口
- [x] 生成 L0 静态渲染测试页面（components/ + styles/）
- [x] **AI Review L0 测试页面**：对照实际组件源码核查 API，自动修正问题
- [x] 生成 L1 简单交互测试页面（interactions/click, input, modal）
- [x] **AI Review L1 测试页面**：核查交互组件 API 正确性，自动修正
- [x] 生成 L2 复杂交互测试页面（interactions/list-scroll, gesture, navigation）
- [x] 生成动画测试页面（animations/）
- [x] 生成组合场景测试页面（composite/）
- [x] **AI Review L2/动画/组合场景测试页面**，自动修正问题（补全 JSFrameAnimTestPage、PropertyAnimTestPage 空文件；创建 composite/SearchTestPage、composite/FormTestPage）
- [x] 注册所有测试页面路由（通过 @Page 注解自动注册）

### Phase 3：L0 静态用例集 ✅ **已完成**

- [x] 为 L0 测试页面生成并持续扩展对应的 E2E 测试用例；实际 spec 清单以 `web-e2e/tests/L0-static/` 当前目录为准
- [x] 完成全部 CSS 样式的 L0 截图测试（border / gradient / opacity / overflow / shadow / transform）
- [x] 截图基准已建立并持续随用例扩展维护；具体 test 数不在本文档中固定维护

### Phase 4：L1/L2 交互用例集 ✅ **已完成**

- [x] 实现 KuiklyPage Fixture 的滚动/手势方法（`scrollInContainer`、`swipeInContainer` 已在 Phase 1 实现）
- [x] 基础 L1 用例（click / input / modal 起始集）已完成，并已扩展出 modules、button-events、window-resize 与 managed auto spec；实际规模以 `web-e2e/tests/L1-simple/` 当前目录为准
- [x] 基础 L2 用例（listscroll / gesture / navigation 起始集）已完成；实际非动画 spec 清单以 `web-e2e/tests/L2-complex/` 当前目录为准
- [x] composite 组合场景仍由 `search.spec.ts` 与 `form.spec.ts` 覆盖；具体 test 数以当前文件内容为准

### Phase 5：动画测试 ✅ **已完成**

- [x] 实现 `captureAnimationFrames`、`waitForAnimationEnd` 等动画辅助方法（已在 Phase 1 实现）
- [x] 补全 `countFrameDiffs`、`framesDiffer` 帧差异对比辅助方法（`kuikly-page.ts`）
- [x] `animations/` 目录同时包含 hand-written spec 与 managed auto spec；实际文件清单以 `web-e2e/tests/L2-complex/animations/` 当前目录为准
- [x] 已覆盖 CSS Transition、KR 属性动画、JS 帧动画与 PAG 页面基础交互；各 spec 的具体 test 数以当前文件内容为准，如后续补充更深的 PAG SDK 行为验证，可继续在此阶段增量扩展

### Phase 6：覆盖率与 CLI ✅ **已完成**

- [x] 实现 Istanbul 插桩流程（`scripts/instrument.mjs`，以目录模式插桩 h5App.js → `instrumented/`）
- [x] 实现插桩版测试服务器（`scripts/serve-instrumented.mjs`，优先提供 instrumented/ 目录文件）
- [x] 实现覆盖率收集工具（`fixtures/coverage.ts`，导出 `collectCoverage()` 函数）
- [x] 配置 NYC 覆盖率阈值（`.nycrc.json`：lines/functions/statements ≥ 70%，branches ≥ 55%）
- [x] 统一覆盖率方案口径：以 NYC 官方 Kotlin 文件覆盖率结果作为唯一门禁与对外展示结果
- [x] 实现 `kuikly-test.mjs` CLI 脚本（支持 `--full / --level / --instrument / --coverage-only` 等参数，并作为本地一键闭环标准入口）
- [x] 补充 `package.json` 脚本（`instrument` / `instrument:with-native` / `coverage` / `coverage:check` / `serve:instrumented` / `kuikly-test`，其中 `instrument:with-native` 与 `serve:instrumented` 为调试辅助脚本）
- [x] 修正 `package.json` 中 `test:L1` 路径（`L1-interaction` → `L1-simple`）

### Phase 7：CI/CD 与 Skill（收口中）

- [ ] 配置蓝盾 Pipeline，并明确在 CI 中复用与本地一致的 CLI 一键执行入口
- [x] 编写仓内 Skill 定义文件（`kuikly-web-autotest/SKILL.md`；`kuikly-web-autotest/agents/openai.yaml` 提供配套元数据）
- [x] 完成闭环入口与使用文档核查（`run-autotest-loop.mjs`、README / QUICKSTART 文档已对齐当前代码）
- [x] 编写使用说明文档（重写 `web-e2e/README.md` + `web-e2e/QUICKSTART.md`，淘汰 Phase 1 旧内容）
- [x] 落地截图基准一致性方案（见下方「截图基准一致性方案」）

#### 截图基准一致性方案（方案 F：Chrome 参数 + 内嵌 Web Font）

**核心问题：** 视觉回归截图在不同操作系统（Windows/Mac/Linux）因字体渲染、抗锯齿差异，会产生像素级不同，导致 CI 误报。

**解决思路：** 通过两个轻量手段从源头消除差异，完全不需要 Docker：

| 方案 | 手段 | 说明 |
|------|------|------|
| 方案一 | Chrome 启动参数 | `--font-render-hinting=none`、`--disable-font-subpixel-positioning`、`--force-device-scale-factor=1`，禁用字体 Hinting 和次像素定位，减少大部分字体像素差异 |
| 方案二 | 内嵌 Web Font | serve.js 向 index.html 注入 NotoSansSC WOFF2 字体，将文字渲染与系统字体解耦；`npm run setup` 下载字体文件（约 1 分钟，只需一次） |

**落地文件：**

| 文件 | 说明 |
|------|------|
| `web-e2e/playwright.config.js` | `launchOptions.args` 注入 3 个 Chrome 参数；`maxDiffPixelRatio` 调整为 `0.02` |
| `web-e2e/scripts/setup-fonts.mjs` | 下载 Noto Sans SC WOFF2 到 `fonts/` 目录 |
| `web-e2e/scripts/serve.js` | 向 HTML 注入字体 CSS；新增 `/fonts/*` 路由 |
| `web-e2e/scripts/serve-instrumented.mjs` | 同上注入逻辑 |

**工作流：**

```bash
# 首次：下载字体（约 1 分钟，只需一次）
npm run setup

# 日常标准入口：本地一键完成完整闭环
node web-e2e/scripts/kuikly-test.mjs --full

# 仅在本地调试单轮用例时，可直接运行 Playwright（不生成正式覆盖率报告）
npm test

# 需要更新截图时：本地生成，review 后 commit
npm run test:update-snapshots
# → git diff tests/   （review 截图变更）
# → git add tests/ && git commit -m "chore: update snapshots"
```

**降级策略：** 若未执行 `npm run setup`（无字体文件），Chrome 参数仍生效（方案一保底），字体注入静默跳过，`maxDiffPixelRatio: 0.02` 兜底。

---

## 16. 待确认项

请逐条确认或提出修改意见：

- [x] **渲染层改动位置**：在 `createRenderViewHandler` 中注入 `data-kuikly-component`，已在 Phase 1 实现；复用路径无需额外处理（已确认）
- [x] **测试页面路由**：使用格式 `http://localhost:8080?page_name=TestPageName`（已确认）
- [x] **静态服务器端口**：使用 8080 端口，已在 `playwright.config.js` 的 `webServer` 中配置并固定，用于 Playwright 本地调试路径（已确认）
- [x] **覆盖率阈值与口径**：整体门禁定为 lines/functions/statements ≥ 70%、branches ≥ 55%；覆盖率结果统一以 NYC 官方 Kotlin 文件覆盖率结果为准；webpack UMD 包装分支通过在插桩前注入 `/* istanbul ignore next */` 排除，不影响阈值（已确认）
- [x] **截图基准更新策略**：Chrome 参数 + 内嵌 Web Font 方案（方案 F）— 开发者本地运行 `npm run setup`（下载字体）后执行 `npm run test:update-snapshots` 生成截图，跨平台差异通过技术手段消除，无需 Docker，review 后 git commit（已落地）
- [x] **浏览器范围**：当前及近期仅配置 Chromium，暂不扩展 WebKit/Firefox（已确认）
- [x] **Skill 优先级**：Skill 在 Phase 7 实施即可（已确认）
- [x] **测试页面维护**：新增渲染组件/样式时，由 AI 自动在 web-test 中补充测试页面（已确认）
- [x] **测试页面唯一来源**：`web-e2e/tests/` 只能访问 `demo/.../pages/web_test/` 下页面；若测试属性缺页，必须先补 `web_test` 页面再补 spec（已确认）

---

> **当前状态：** Phase 1-6 已完成并进入收口阶段。当前仓库已落地 `kuikly-web-autotest/SKILL.md` 与闭环执行器 `kuikly-web-autotest/scripts/run-autotest-loop.mjs`，文档应统一以它们为准；Phase 7 中蓝盾 Pipeline 仍待推进，CI 部分目前仍属于目标态设计。
