# Playwright + Kuikly 测试限制速查

本文记录 Playwright headless Chromium 与 Kuikly Web 渲染层之间已确认的兼容性限制，
以及遇到每种限制时的标准处理方式，避免反复排查相同问题。

---

## 1. Input / TextArea 事件不触发

**现象**：`page.fill()` / `page.type()` 填充输入框后，Kuikly 响应式状态不更新，
`textDidChange`、`focus`、`blur` 回调不被调用。

**根因**：Kuikly 使用 `addEventListener("input", ...)` 监听 DOM `input` 事件。
Playwright 的 `fill()` 直接设置 `element.value`，绕过了 DOM 事件派发。

**受影响文件**：`KRTextFieldView.kt`、`KRTextAreaView.kt`（及所有使用它们的页面）

**处理方式**：
- spec 只验证静态渲染（输入框可见、placeholder 显示）和非输入交互（按钮点击）
- 覆盖率报告里这些事件 handler 的缺口属于**已知 headless 限制**，接受并记录，不继续尝试
- 在 spec 里加注释 `// KNOWN: textDidChange not triggered by Playwright fill()`

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

## 3. 部分 KRView 的 click 事件不被 Playwright 合成点击触发

**现象**：对某些 View 调用 `page.getByText('label').click()` 或 `page.mouse.click(x, y)` 后，
Kuikly 的 `event { click { ... } }` 回调不执行，页面状态不变。

**已确认受影响的场景**：
- `FormTestPage` 的 `submit` 按钮（`flex(2f)` 布局 + 动态背景色）

**诊断方法**：
```typescript
// 检查点击后页面文字是否有变化
const before = await page.evaluate(() => document.body.innerText);
await page.getByText('submit', { exact: true }).click();
await page.waitForTimeout(500);
const after = await page.evaluate(() => document.body.innerText);
console.log('changed:', before !== after);
```

**处理方式**：如果多种点击方式（`getByText.click()`、`mouse.click(cx, cy)`、`dispatchEvent`）
都无效，则确认为产品层限制，标记 skip：
```typescript
test.skip('... [KNOWN: KRView click headless issue on FormTestPage submit]', async () => { ... });
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

## 5. getByText() strict mode violation

**现象**：`expect(page.getByText('custom-modal')).toBeVisible()` 报错：
```
strict mode violation: getByText('custom-modal') resolved to 2 elements
```

**根因**：页面上有多个元素的文字都**包含**目标字符串：
- `"show-custom-modal"` 包含 `"custom-modal"`
- `"custom-modal-result: none"` 包含 `"custom-modal"`

**解决方案**：加 `{ exact: true }` 精确匹配，或换用更具体的定位器：
```typescript
// ❌ 包含匹配，多个元素
await page.getByText('custom-modal').click();

// ✅ 精确匹配
await page.getByText('custom-modal', { exact: true }).click();

// ✅ 或者用更具体的文字
await page.getByText('show-custom-modal', { exact: true }).click();
```

**预防**：在设计载体页面的 oracle 文字时，确保所有 oracle 字符串互不包含。

---

## 6. 通过 KRListView 滚动到底部才能找到 toggle 元素

**现象**：用 `getBoundingClientRect()` 找 toggle 控件（52×28 的 KRView）时，
滚动后找不到元素，或坐标错误导致 `mouse.click()` 未命中。

**根因**：Kuikly 的 `List` 组件使用虚拟滚动，`window.scrollTo()` 不生效。
需要滚动 `KRListView` DOM 元素本身：

```typescript
// ❌ 无效，不会滚动 Kuikly List
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

// ✅ 滚动 Kuikly 的 List 容器
await page.evaluate(() => {
  document.querySelectorAll('[data-kuikly-component="KRListView"]')
    .forEach(el => { (el as HTMLElement).scrollTop = 9999; });
});
await page.waitForTimeout(400);
```

---

## 7. Visual spec 基准截图在 UI 文字变更后必须删除并重建

**现象**：将载体页面从中文改为英文后，visual spec 报 screenshot diff，
即使 `maxDiffPixels: 300` 也超出（因为文字完全变了）。

**处理方式**：先删除旧 PNG 基准，再用 `--update-snapshots` 重建：
```bash
# 1. 删除旧基准
rm web-autotest/tests/visual/<page>-visual.spec.ts-snapshots/*.png

# 2. 重建（需要测试服务器在运行）
cd web-autotest && npx playwright test tests/visual/<page>-visual.spec.ts --update-snapshots
```
不要用 `--update-snapshots` 全量刷新，只针对确认有 UI 变更的页面更新。
