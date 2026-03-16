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
- [5. E2E 测试目录结构](#5-e2e-测试目录结构)
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
- [13. CI/CD 集成（蓝盾）](#13-cicd-集成蓝盾)
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
| **覆盖率**     | Istanbul 插桩 `core-render-web/base` + `core-render-web/h5` 的 Kotlin/JS 产物 |
| **运行方式**   | CLI 本地一键运行 + 腾讯蓝盾 CI/CD 自动化                             |
| **AI 辅助**    | CodeBuddy Skill 支持一键运行、用例编写指导、AI 自动生成单测          |

---

## 2. 整体架构

```
┌───────────────────────────────────────────────────┐
│                 Skill Layer                        │
│   CodeBuddy Skill (一键运行 / 编写指导 / AI生成)    │
├───────────────────────────────────────────────────┤
│                  CLI Layer                         │
│   kuikly-test.mjs                                 │
│   编排: gradle构建 → 启动dev-server → 执行测试      │
│         → 收集覆盖率 → 生成报告                      │
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
│   NYC 生成报告 + 阈值门禁                            │
└───────────────────────────────────────────────────┘
```

**数据流：**

```
web-test 测试页面 (demo/src/commonMain/kotlin/.../pages/web_test/)
       ↓ Gradle KMP 编译
nativevue2.js (Kotlin/JS 产物 = 测试页面 + 渲染引擎代码)
       ↓ webpack dev server 加载
h5App (宿主页面 index.html + h5App.js)
       ↓ 浏览器渲染
DOM (div + absolute 定位 + data-kuikly-component 属性)
       ↓ Playwright 控制浏览器
截图对比 / DOM 断言 / 交互验证
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
├── components/                    # 渲染组件测试页面
│   ├── KRViewTestPage.kt          # KRView 渲染验证
│   ├── KRTextViewTestPage.kt      # KRTextView 文本渲染验证
│   ├── KRRichTextViewTestPage.kt  # KRRichTextView 富文本渲染验证
│   ├── KRImageViewTestPage.kt     # KRImageView 图片加载/渲染验证
│   ├── KRListViewTestPage.kt      # KRListView 列表渲染+滚动验证
│   ├── KRScrollViewTestPage.kt    # KRScrollView 滚动验证
│   ├── KRInputViewTestPage.kt     # KRInputView 输入交互验证
│   ├── KRCanvasViewTestPage.kt    # KRCanvasView 绘制验证
│   ├── KRVideoViewTestPage.kt     # KRVideoView 视频首帧验证
│   └── KRModalViewTestPage.kt     # KRModalView 弹窗交互验证
│
├── styles/                        # CSS 样式测试页面
│   ├── BorderTestPage.kt          # border / borderRadius 渲染验证
│   ├── ShadowTestPage.kt          # shadow 渲染验证
│   ├── GradientTestPage.kt        # gradient 渲染验证
│   ├── TransformTestPage.kt       # transform 渲染验证
│   ├── OpacityTestPage.kt         # opacity 渲染验证
│   └── OverflowTestPage.kt        # overflow 渲染验证
│
├── interactions/                   # 交互行为测试页面
│   ├── ClickTestPage.kt           # 点击事件验证
│   ├── GestureTestPage.kt         # 手势操作验证（拖拽/缩放）
│   ├── ListScrollTestPage.kt      # 列表滚动（含 stickyHeader/分页）
│   ├── InputTestPage.kt           # 输入框全流程验证
│   ├── ModalTestPage.kt           # 弹窗弹出/关闭验证
│   └── NavigationTestPage.kt      # 页面跳转验证
│
├── animations/                     # 动画测试页面
│   ├── CSSTransitionTestPage.kt   # CSS Transition 动画验证
│   ├── JSFrameAnimTestPage.kt     # JS 帧动画验证
│   ├── PropertyAnimTestPage.kt    # KR 属性动画验证
│   └── PAGAnimTestPage.kt         # PAG 动画验证
│
└── composite/                      # 组合场景测试页面
    ├── SearchTestPage.kt           # 搜索场景（输入+点击+列表滚动）
    └── FormTestPage.kt             # 表单场景（多输入框+开关+提交）
```

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

### 3.4 测试页面分类清单

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
│  3. 注册路由                                           │
│     每个测试页面注册独立路由，格式如：                   │
│     /web-test/components/KRListView                    │
│     /web-test/styles/border                            │
│     /web-test/interactions/click                       │
└────────────────────┬─────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────┐
│  4. 生成对应的 E2E 测试用例                             │
│     每个测试页面 → 一个或多个 .spec.ts 测试文件          │
│     测试中通过路由访问对应的 web-test 测试页面           │
└──────────────────────────────────────────────────────┘
```

> **核心价值：** 测试页面与 Demo 页面完全解耦。Demo 随业务需求自由变更，测试页面保持稳定。新增渲染组件或样式时，只需在 `web_test` 中新增对应的测试页面即可。

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

## 5. E2E 测试目录结构

```
e2e/
├── package.json              # npm 依赖 (playwright, nyc, etc.)
├── playwright.config.ts      # Playwright 配置
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
│   ├── L0-static/            # L0 级别：静态渲染截图对比
│   │   ├── components/       # 渲染组件验证 (KRView, KRImageView, KRTextView, ...)
│   │   └── styles/           # CSS 样式渲染 (border, shadow, gradient, ...)
│   │
│   ├── L1-simple/            # L1 级别：简单交互
│   │   ├── click/            # 点击事件
│   │   ├── input/            # 输入框交互
│   │   └── toggle/           # 开关/切换
│   │
│   ├── L2-complex/           # L2 级别：复杂交互
│   │   ├── scroll/           # 列表滚动
│   │   ├── gesture/          # 手势操作
│   │   ├── animation/        # 动画验证
│   │   └── navigation/       # 页面跳转
│   │
│   └── unit/                 # 可选：纯逻辑的单元测试
│       ├── modules/          # Module 逻辑测试
│       └── utils/            # 工具方法测试
│
├── snapshots/                # 截图基准文件（git 跟踪）
│   ├── L0-static/
│   ├── L1-simple/
│   └── L2-complex/
│
└── reports/                  # 生成的报告（.gitignore）
    ├── html/                 # Playwright HTML 报告
    └── coverage/             # Istanbul 覆盖率报告
```

---

## 6. 交互用例自动化设计原则

### 6.1 核心理念：生成即完整，执行零介入

自动化测试的「零人工介入」包含两个层面：

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
| `KRScrollView`                    | ① 垂直/水平滚动 → 每步截图 ② 滚动到边界验证                                                    | L2       |
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
│     KRListView  → 必须包含滚动操作              │
│     KRInputView → 必须包含输入操作              │
│     KRView (有点击) → 必须包含点击操作          │
│     KRModalView → 必须包含弹出/关闭操作         │
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
  await kuiklyPage.goto('/web-test/interactions/search');
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
// 注释: 以上所有交互步骤由 AI 根据渲染组件类型自动推导，无需人工指定
```

> **核心价值：** 有了这个知识库，AI 看到 `KRListView` 就**一定会**生成滚动测试，看到 `KRInputView` 就**一定会**生成输入测试。不会遗漏，也不需要人工检查和补充。

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
  await kuiklyPage.goto('/web-test/interactions/click');
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
  await kuiklyPage.goto('/web-test/interactions/input');
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
  await kuiklyPage.goto('/web-test/interactions/list-scroll');
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
  await kuiklyPage.goto('/web-test/interactions/gesture');
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
  await kuiklyPage.goto('/web-test/interactions/navigation');
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
  await kuiklyPage.goto('/web-test/composite/search');
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
  await kuiklyPage.goto('/web-test/composite/form');
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
  await kuiklyPage.goto('/web-test/components/KRImageView');
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

### 8.3 用例示例

```typescript
test('KRView fade-in animation', async ({ kuiklyPage }) => {
  await kuiklyPage.goto('/web-test/animations/css-transition');
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
  
  /** 导航到指定测试页面 */
  async goto(pageName: string): Promise<void>;
  
  /** 等待 Kuikly 渲染完成（监听特定标志或 idle 状态） */
  async waitForRenderComplete(timeout?: number): Promise<void>;

  // ==================== 组件定位 ====================
  
  /** 通过 data-kuikly-component 属性定位组件 */
  component(type: string): Locator;
  // 用法: kuiklyPage.component('KRListView').first()
  
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
  
  /** 等待页面中任意元素的 transitionend 事件 */
  async waitForAnyTransitionEnd(): Promise<void>;
  
  /** 获取元素的计算样式 */
  async getComputedStyles(
    locator: Locator, 
    properties: string[]
  ): Promise<Record<string, string>>;
  
  /** 比较两帧截图是否有视觉差异 */
  framesDiffer(a: Buffer, b: Buffer, options?: { threshold?: number }): boolean;
  
  /** 统计帧序列中相邻帧的差异数量 */
  countFrameDiffs(frames: Buffer[], options?: { threshold?: number }): number;

  // ==================== 批量交互执行 ====================
  
  /** 按预定义步骤序列自动执行交互（声明式，零人工介入） */
  async runSteps(steps: InteractionStep[]): Promise<void>;
  // 支持的步骤类型: click, input, scroll, swipe, drag, longPress,
  //                 wait, waitForRender, snapshot, assert
}
```

---

## 10. Playwright 配置

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  
  // 截图对比配置
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,     // 允许 1% 像素差异
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
      use: { ...devices['Desktop Chrome'] },
    },
    // Kuikly Web 主要面向移动端 H5，暂只用 Chromium
  ],

  // dev server 由 CLI 脚本管理，不在此配置
  // webServer: { ... }
});
```

---

## 11. CLI 统一入口

### 11.1 脚本位置

```
e2e/scripts/kuikly-test.mjs
```

### 11.2 命令接口

```bash
# 完整流程（构建 + 启动 server + 测试 + 覆盖率）
node e2e/scripts/kuikly-test.mjs --full

# 仅运行指定级别用例
node e2e/scripts/kuikly-test.mjs --level L0
node e2e/scripts/kuikly-test.mjs --level L1
node e2e/scripts/kuikly-test.mjs --level L2

# 运行指定用例文件
node e2e/scripts/kuikly-test.mjs --test tests/L0-static/components/image.spec.ts

# 更新截图基准
node e2e/scripts/kuikly-test.mjs --update-snapshots

# 仅生成覆盖率报告
node e2e/scripts/kuikly-test.mjs --coverage-only

# 跳过构建（使用已有产物）
node e2e/scripts/kuikly-test.mjs --skip-build --level L0
```

### 11.3 执行流程

```
┌─────────────────────────┐
│  1. 解析 CLI 参数        │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  2. Gradle 构建          │  --skip-build 可跳过
│  (web-test 测试页面 + h5App 产物) │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  3. Istanbul 插桩        │  对 Kotlin/JS 产物插桩
│  (nativevue2.js 等)      │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  4. 启动 webpack          │
│  dev server (port 8080)  │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  5. 执行 Playwright 测试  │  按 --level 过滤
│  npx playwright test     │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  6. 收集覆盖率数据        │  从浏览器 __coverage__ 导出
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  7. NYC 生成覆盖率报告    │
│  + 阈值检查              │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  8. 生成 HTML 报告        │  Playwright HTML Report
│  关闭 dev server         │
└─────────────────────────┘
```

---

## 12. 代码覆盖率

### 12.1 插桩目标

| 产物文件         | 来源                                | 说明                      |
| ---------------- | ----------------------------------- | ------------------------- |
| `nativevue2.js`  | `demo` + `core-render-web/base` 编译 | 包含 base 层核心渲染代码 + web-test 测试页面 |
| `h5App.js`       | `h5App` + `core-render-web/h5` 编译  | 包含 h5 平台特定实现       |

### 12.2 NYC 配置

```json
// e2e/.nycrc.json
{
  "all": true,
  "include": ["instrumented/**/*.js"],
  "reporter": ["text", "html", "lcov"],
  "report-dir": "reports/coverage",
  "check-coverage": true,
  "lines": 60,
  "functions": 60,
  "statements": 60,
  "branches": 50
}
```

### 12.3 覆盖率收集流程

1. **构建后插桩：** 用 `nyc instrument` 对 Kotlin/JS 产物进行 Istanbul 插桩
2. **替换加载：** webpack dev server 加载插桩后的 JS 文件
3. **运行时收集：** 浏览器中执行测试时，`window.__coverage__` 自动收集覆盖率数据
4. **导出合并：** 测试结束后通过 `page.evaluate(() => window.__coverage__)` 导出，NYC 合并生成报告

---

## 13. CI/CD 集成（蓝盾）

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
      - npm ci (e2e/)
      - npx playwright install chromium

  - name: "构建产物"
    steps:
      - gradle :demo:jsBrowserProductionWebpack
      - gradle :h5App:jsBrowserProductionWebpack
    condition: "非 --skip-build 模式"

  - name: "执行测试"
    steps:
      - node e2e/scripts/kuikly-test.mjs --full --level ${LEVEL}
    env:
      CI: true

  - name: "收集报告"
    steps:
      - archive e2e/reports/html/
      - archive e2e/reports/coverage/
      - archive e2e/snapshots/ (失败时)

  - name: "质量门禁"
    steps:
      - 覆盖率阈值检查
      - 截图对比失败数 == 0
```

### 13.3 截图基准管理

- 截图基准文件存储在 `e2e/snapshots/` 目录，**纳入 Git 版本管理**
- 首次运行或新增用例时，用 `--update-snapshots` 生成基准
- CI 中如果截图对比失败，报告中会展示 diff 图片便于排查
- 更新基准需要本地运行后 commit 到仓库

---

## 14. CodeBuddy Skill 设计

### 14.1 Skill 功能

| 能力             | 说明                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| **一键运行**     | `@skill kuikly-test run [--level L0/L1/L2]`，自动执行 CLI 流程            |
| **编写指导**     | `@skill kuikly-test guide`，输出用例编写模板、Fixture API 说明、最佳实践    |
| **AI 自动生成**  | `@skill kuikly-test generate <TestPage>`，分析 web-test 测试页面源码自动生成对应测试 |
| **覆盖率查看**   | `@skill kuikly-test coverage`，展示当前覆盖率摘要                          |

### 14.2 AI 自动生成流程

```
1. 读取指定 web-test 测试页面的 Kotlin 源码 (demo/src/commonMain/.../pages/web_test/...)
2. 分析页面渲染后会产生的底层渲染组件类型（data-kuikly-component）
   ├─ KRListView     → 滚动/滑动/翻页类
   ├─ KRScrollView   → 滚动类
   ├─ KRInputView / KRTextFieldView → 输入类
   ├─ KRView (有点击/手势行为)      → 点击/拖拽/手势类
   ├─ KRModalView    → 弹窗类
   ├─ KRImageView    → 图片加载验证
   ├─ KRTextView / KRRichTextView   → 静态渲染验证
   ├─ KRCanvasView   → 静态绘制验证
   └─ KRVideoView    → 视频首帧验证
3. 查询「组件交互特征知识库」(6.2节)
   → 根据渲染组件类型获取必须验证的交互操作清单
4. 合并所有组件的交互清单（取并集）
5. 确定测试级别：L0 / L1 / L2（取最高）
6. 基于交互清单 + 模板，生成包含完整交互步骤的测试用例
   → 每个交互操作都包含：定位 + 操作 + 等待 + 截图验证
7. 输出到 e2e/tests/L{N}/... 目录
```

**关键设计：** 步骤 3 是核心——通过查询知识库，AI **不可能遗漏** 某个渲染组件需要的交互操作。只要识别到页面中有 `KRListView`，就一定会生成滚动测试步骤；识别到 `KRInputView`，就一定会生成输入测试步骤。测试页面本身也是按组件类型精确组织的，确保覆盖完整。

### 14.3 Skill 文件

Skill 定义文件位于 `.codebuddy/rules/kuikly-test.md`，包含：

- 项目上下文（Kuikly Web 架构说明）
- **组件交互特征知识库**（渲染组件 `KRXxxView` → 必须验证的交互操作映射表，来自 6.2 节）
- Fixture API 文档
- 用例编写规范与模板
- 命名约定（文件名、截图名）
- web-test 测试页面设计原则（来自 3.3 节）
- AI 生成策略（分析测试页面源码 → 查表 → 生成完整用例）

---

## 15. 实施计划

### Phase 1：基础设施搭建（预计 2 天）

- [ ] 渲染层改动：`KuiklyRenderLayerHandler.kt` 注入 `data-kuikly-component`
- [ ] 创建 `e2e/` 目录结构
- [ ] 初始化 `package.json`、`playwright.config.ts`、`tsconfig.json`
- [ ] 实现 `KuiklyPage` Fixture 核心方法（goto, waitForRenderComplete, component）
- [ ] 编写 1 个 L0 冒烟测试验证流程打通

### Phase 2：web-test 测试页面生成（预计 3 天）

- [ ] 在 `demo/src/commonMain/.../pages/` 下创建 `web_test/` 目录结构
- [ ] 生成 L0 静态渲染测试页面（components/ + styles/）
- [ ] 生成 L1 简单交互测试页面（interactions/click, input, modal）
- [ ] 生成 L2 复杂交互测试页面（interactions/list-scroll, gesture, navigation）
- [ ] 生成动画测试页面（animations/）
- [ ] 生成组合场景测试页面（composite/）
- [ ] 注册所有测试页面路由

### Phase 3：L0 静态用例集（预计 2 天）

- [ ] 为每个 L0 测试页面生成对应的 E2E 测试用例
- [ ] 完成全部 CSS 样式的 L0 截图测试
- [ ] 生成初始截图基准

### Phase 4：L1/L2 交互用例集（预计 3 天）

- [ ] 实现 KuiklyPage Fixture 的滚动/手势方法
- [ ] 完成 L1 用例（点击、输入、弹窗）
- [ ] 完成 L2 用例（滚动、手势、页面跳转）

### Phase 5：动画测试（预计 2 天）

- [ ] 实现 `captureAnimationFrames`、`waitForAnimationEnd` 等动画辅助方法
- [ ] 完成 L2 动画测试用例
- [ ] 验证四种动画类型的测试覆盖

### Phase 6：覆盖率与 CLI（预计 2 天）

- [ ] 实现 Istanbul 插桩流程
- [ ] 实现 `kuikly-test.mjs` CLI 脚本
- [ ] 配置 NYC 覆盖率阈值

### Phase 7：CI/CD 与 Skill（预计 2 天）

- [ ] 配置蓝盾 Pipeline
- [ ] 编写 CodeBuddy Skill 定义文件
- [ ] 端到端验证完整流程
- [ ] 编写使用说明文档

---

## 16. 待确认项

请逐条确认或提出修改意见：

- [ ] **渲染层改动位置**：在 `createRenderViewHandler` 中注入 `data-kuikly-component`，是否还需要在其他位置（如复用路径）也补充设置？
- [ ] **测试页面路由**：web-test 测试页面的 URL 路由格式建议为 `http://localhost:8080/#/web-test/components/KRListView`，是否合适？
- [ ] **webpack dev server 端口**：默认使用 8080 端口是否合适？
- [ ] **覆盖率阈值**：初始目标 lines/functions/statements ≥ 60%、branches ≥ 50% 是否合理？
- [ ] **截图基准更新策略**：是否需要 CI 中自动更新基准的机制（如 MR label 触发），还是始终手动更新？
- [ ] **浏览器范围**：当前仅配置 Chromium，是否需要后续支持 WebKit/Firefox？
- [ ] **Skill 优先级**：Skill 是否在 Phase 7 实施即可，还是需要提前？
- [ ] **测试页面维护**：新增渲染组件/样式时，是否由 AI 自动在 web-test 中补充测试页面？

---

> **下一步：** 请审阅以上方案，确认或提出修改意见。确认后我将从 Phase 1 开始实施。
