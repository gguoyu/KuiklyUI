# Playwright + Kuikly 测试限制速查

本文记录 Playwright headless Chromium 与 Kuikly Web 渲染层之间已确认的兼容性限制，
以及遇到每种限制时的标准处理方式，避免反复排查相同问题。

---

## 1. Input / TextArea 事件不触发 ✅ 已解决

**现象**：`page.fill()` / `page.type()` 填充输入框后，Kuikly 响应式状态不更新，
`textDidChange`、`focus`、`blur` 回调不被调用。

**根因**：Kuikly 使用 `addEventListener("input", ...)` 监听 DOM `input` 事件。
Playwright 的 `fill()` 直接设置 `element.value`，绕过了 DOM 事件派发。
**这不是 headless 限制**，headed 模式下 `fill()` 行为相同。

**受影响文件**：`KRTextFieldView.kt`、`KRTextAreaView.kt`（及所有使用它们的页面）

**解决方案**：使用 `KuiklyPage.fillInput(locator, text)` 替代 `locator.fill(text)`。
该方法通过 `evaluate()` 在 DOM 上设置 value 后手动派发 `input` 和 `change` 事件：
```typescript
// ❌ 旧写法：不触发 Kuikly 事件
await input.fill('hello');

// ✅ 新写法：触发 Kuikly textDidChange 回调
await kuiklyPage.fillInput(input, 'hello');
```

---

## 2. Kuikly Modal 组件不在 headless 下渲染

**现象**：点击触发 `if (ctx.showModal) { Modal { ... } }` 的按钮后，Modal 内容完全不出现。

**根因**：Kuikly 的 `Modal` DSL 通过特定渲染机制挂载到页面层级之上，
此机制在 headless Chromium 下不工作。

**受影响场景**：所有使用 `Modal { }` 的载体页面（如 `ModalTestPage`）

**处理方式**：
```typescript
// 标记为 skip，说明原因
test.skip('custom modal flow [KNOWN: Modal headless rendering issue]', async ({ kuiklyPage }) => {
  // ...
});
```
不要删除测试逻辑，留待 headless 支持修复后恢复。

---

## 3. 部分 KRView 的 click 事件不被 Playwright 合成点击触发 ✅ 有解决方案

**现象**：对某些 View 调用 `page.getByText('label').click()` 或 `page.mouse.click(x, y)` 后，
Kuikly 的 `event { click { ... } }` 回调不执行，页面状态不变。

**已确认受影响的场景**：
- `FormTestPage` 的 `submit` 按钮（`flex(2f)` 布局 + 动态背景色）

**根因**：**不是 headless 限制**。Playwright 的 `click()` 计算元素中心坐标后模拟鼠标事件，
但某些 Kuikly 布局条件下（z-index、flex 嵌套）实际点击目标可能不是预期元素。

**解决方案**：使用 `KuiklyPage.forceClick(locator)` 替代 `locator.click()`。
该方法通过 `evaluate()` 直接在 DOM 上 `dispatchEvent(new MouseEvent('click'))`：
```typescript
// ❌ 旧写法：可能被遮挡
await page.getByText('submit').click();

// ✅ 新写法：绕过 Playwright 点击目标计算
await kuiklyPage.forceClick(page.getByText('submit', { exact: true }));
```

**诊断方法**：
```typescript
// 检查点击后页面文字是否有变化
const before = await page.evaluate(() => document.body.innerText);
await page.getByText('submit', { exact: true }).click();
await page.waitForTimeout(500);
const after = await page.evaluate(() => document.body.innerText);
console.log('changed:', before !== after);
```

---

## 4. PAGE_CRASH 导致测试超时

**现象**：某个测试导致 `page.goto()` 时页面崩溃，后续测试因为页面 context 损坏而 TIMEOUT。

**已确认受影响的场景**：`KRScrollContentViewTestPage` 在 coarse-pointer 模式下

**处理方式**：
```typescript
// 标记 skip，不删测试逻辑
test.skip('... [KNOWN: PAGE_CRASH on KRScrollContentViewTestPage]', async ({ kuiklyPage }) => {
  // 保留原始测试代码
});
```

---

## 5. getByText() strict mode violation — 编码规范

**现象**：`expect(page.getByText('custom-modal')).toBeVisible()` 报错：
```
strict mode violation: getByText('custom-modal') resolved to 2 elements
```

**根因**：**不是限制**，是测试代码的定位策略问题。页面上有多个元素的文字都**包含**目标字符串。

**规范**：所有 `getByText()` 调用都应使用 `{ exact: true }` 精确匹配：
```typescript
// ❌ 包含匹配，可能多个元素
await page.getByText('custom-modal').click();

// ✅ 精确匹配
await page.getByText('custom-modal', { exact: true }).click();
```

**预防**：在设计载体页面的 oracle 文字时，确保所有 oracle 字符串互不包含。

---

## 6. 通过 KRListView 滚动到底部才能找到 toggle 元素 ✅ 已封装

**现象**：用 `getBoundingClientRect()` 找 toggle 控件（52×28 的 KRView）时，
滚动后找不到元素，或坐标错误导致 `mouse.click()` 未命中。

**根因**：**不是 headless 限制**，是 Kuikly 框架特性。`List` 组件使用虚拟滚动，`window.scrollTo()` 不生效。
需要滚动 `KRListView` DOM 元素本身。

**解决方案**：使用 `KuiklyPage` 提供的封装方法：
```typescript
// ✅ 增量滚动
const list = kuiklyPage.component('KRListView').first();
await kuiklyPage.scrollInContainer(list, { deltaY: 500, smooth: false });

// ✅ 滚动到底部
await kuiklyPage.scrollListToBottom(list);

// ❌ 无效，不会滚动 Kuikly List
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
```

---

## 7. Visual spec 基准截图变更后的工作流指南

**说明**：这不是限制，而是 visual regression 测试的正常工作流。任何 UI 文字变更都会导致截图基准失效。

**处理方式**：先删除旧 PNG 基准，再用 `--update-snapshots` 重建：
```bash
# 1. 删除旧基准
rm web-autotest/tests/visual/<page>-visual.spec.ts-snapshots/*.png

# 2. 重建（需要测试服务器在运行）
cd web-autotest && npx playwright test tests/visual/<page>-visual.spec.ts --update-snapshots
```
不要用 `--update-snapshots` 全量刷新，只针对确认有 UI 变更的页面更新。

## 8. H5ListPagingHelper 触摸事件路径无法在 headless Desktop 触发

**现象**：给 PageListTestPage 添加 CDP 触摸滑动测试（`Input.dispatchTouchEvent`），
断言分页切换后 tab 颜色变化，但测试始终失败。

**根本原因**：`H5ListView.setScrollEvent()` 通过 `matchMedia('(pointer: coarse)')` 判断设备类型。
在 headless Chromium（桌面）中，这个媒体查询返回 `false`，因此 **touch 事件监听器（`touchstart`/`touchmove`/`touchend`）从未被注册**。
触摸路径 `handlePagerTouchStart/Move/End` 在桌面 headless 下完全不可达。

**桌面 headless 下 PageList 使用鼠标事件**，`handlePagerMouseDown/Move/Up` 路径已被鼠标拖拽测试覆盖。

**规则**：不要为 H5ListPagingHelper / H5ListView 的 touch 路径编写 CDP 断言测试。
如确实需要记录这个限制，用 `test.skip(true, '[KNOWN: H5ListPagingHelper touch paths only available on coarse-pointer devices]')` 标记。
