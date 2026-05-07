# Kotlin Carrier Page 编写经验

本文记录编写 web_test Kotlin 载体页面时实际遇到的共性坑，避免重复犯错。

---

## 1. DSL 方法名必须 grep 确认，不能猜

**问题**：编写 `KRTextFieldViewTestPage` 时，在 `Input` 的 `attr {}` 块里写了 `editAble(false)`，Kotlin 编译报错：
```
Unresolved reference: editAble
```

**原因**：Kuikly DSL 的方法名和直觉有偏差，`editAble` 是错的，正确方法是 `editable(false)`。

**规则**：写载体页面之前，**先 grep 确认方法名**，不要靠记忆或猜测：
```bash
# 查 Input 组件的 attr 方法
grep -n "fun editable\|fun placeholder\|fun maxText" \
  core/src/commonMain/kotlin/com/tencent/kuikly/core/views/InputView.kt

# 查 TextView 的文字样式方法
grep -n "fun textShadow\|fun textStroke\|fun stroke" \
  core/src/commonMain/kotlin/com/tencent/kuikly/core/views/TextView.kt

# 查 View 通用 attr 方法
grep -n "fun overflow\|fun touchEnable\|fun borderRadius" \
  core/src/commonMain/kotlin/com/tencent/kuikly/core/base/Attr.kt
```

**常见易错方法名**：

| 错误写法 | 正确写法 | 所在文件 |
|---------|---------|---------|
| `editAble(false)` | `editable(false)` | InputView.kt / TextAreaView.kt |
| `strokeColor(color)` | `textStroke(color, width)` | TextView.kt |
| `strokeWidth(n)` | `textStroke(color, width)` | TextView.kt |
| `borderRadius(tl, tr, bl, br)` 全相同时走不同分支 | 全相同用 `borderRadius(Float)` 单参数版本 | Attr.kt |

---

## 2. 共享 observable 导致已有 spec 失效

**问题**：在 `CalendarModuleTestPage.kt` 新增 `formatWithQuotes` 按钮，点击后把结果写入已有的 `formatResult` observable，导致原有 spec 断言的 `"formatted:..."` 文字被覆盖成 `"quoted:..."`，所有 calendar 测试全部失败。

**错误示范**：
```kotlin
// ❌ 复用了 formatResult，会破坏已有 spec
Button {
    event { click { ctx.formatResult = "quoted:${...}" } }
}
```

**正确做法**：新按钮必须使用**独立的 observable**：
```kotlin
// ✅ 独立 observable，不影响已有 spec
private var quotedFormatResult by observable("quoted:pending")

Button {
    event { click { ctx.quotedFormatResult = "quoted:${...}" } }
}
Text { attr { text(ctx.quotedFormatResult) } }
```

**规则**：为现有页面新增功能时，**每个新的状态输出必须有独立的 observable**，绝不复用其他 oracle 的 observable。

---

## 3. 动态模板字符串不能用作 oracle 标签

**问题**：`KRTextFieldViewTestPage` 里有：
```kotlin
Text { attr { text("touch-target-clicks: ${ctx.clickCount}") } }
```
Loop 的页面解析器把 `"touch-target-clicks: ${ctx.clickCount}"` 直接当 `ACTION_LABELS` 提取出来，生成的 spec 里出现了字面量 `${ctx.clickCount}`，无法匹配真实页面。

**规则**：作为 oracle（state-driven text）的初始值和变化值，必须是**静态字符串**，不能含 `${}` 插值：
```kotlin
// ❌ 动态插值，loop 解析错误
Text { attr { text("clicks: ${ctx.count}") } }

// ✅ 用固定 targetLabel/expectLabel 组合
Text { attr { text(if (ctx.count == 0) "clear-idle" else "cleared: ${ctx.count}") } }
// actionScript: { "targetLabel": "clear-idle", "expectLabel": "cleared: 1" }
```

**下游影响（生成 spec 侧）**：当动态模板字符串被提取进生成的 spec 的 `ACTION_LABELS` 时，有两个连锁问题：

1. `clickVisibleLabels()` 永远无法匹配，交互路径实际不执行——测试**静默通过**但未做任何有意义的点击
2. 如果 spec 里同时保留了旧版模板的 `hasUsableInteractionHints()` 守卫（见 §8），因为 `ACTION_LABELS.length > 0`，守卫返回 `true`，`test.skip` 成为 no-op，进一步掩盖了失效

**修复方式**（无需重新生成载体页面，直接修改 spec）：
```typescript
// ❌ 生成的 spec 里出现字面量 ${...}
const ACTION_LABELS = [
  "touch-target-clicks: ${ctx.clickCount}"
];

// ✅ 清空错误标签；确保 actionScripts 覆盖实际交互
const ACTION_LABELS: string[] = [];
// actionScripts 保持正确的 { "kind": "click", "targetLabel": "...", "expectLabel": "..." }
```

**已修复案例（2026-05）**：`auto-cssprops-test-page.spec.ts` 的 `ACTION_LABELS` 曾包含 `"touch-target-clicks: ${ctx.clickCount}"`，已清空；交互覆盖由 `actionScripts` 里的 `touch-enabled`/`touch-disabled` toggle 对承担。

---

## 4. TextArea / Input 事件在 Playwright 中用 fill() 不触发 ✅ 已解决

**问题**：`KRTextAreaView.kt` 和 `KRTextFieldView.kt` 的 `textDidChange`、`focus`、`blur` 等事件处理函数在覆盖率报告里始终为 0，即使写了 `fill()` 调用。

**原因**：Kuikly 的 Input/TextArea 组件通过 `addEventListener("input", ...)` 监听原生 DOM `input` 事件。Playwright 的 `page.fill()` 直接设置 `element.value`，不触发 DOM `input` 事件，所以 Kuikly 的回调永远不被调用。**这不是 headless 限制**，headed 模式下行为相同。

**解决方案**：使用 `KuiklyPage.fillInput(locator, text)` 替代 `locator.fill(text)`：
```typescript
// ✅ 触发 Kuikly textDidChange 回调
await kuiklyPage.fillInput(textarea, 'hello');
```

---

## 5. 为现有页面新增按钮后，记得更新 interaction-protocol.json

**问题**：在 `CalendarModuleTestPage.kt` 加了 `formatWithQuotes` 按钮，但 loop 生成的 managed spec 里 `maxActionLabels: 2`，只点击了前两个按钮，`formatWithQuotes` 没有被点击，目标函数覆盖率无改善。

**规则**：为已有页面**新增需要被测的按钮**时，必须同步在 `web-autotest/rules/interaction-protocol.json` 里添加或更新该页面的 `pageProfile`，明确列出 `actionScripts`：
```json
"CalendarModuleTestPage": {
  "actions": ["run-action-scripts"],
  "actionScripts": [
    { "kind": "click", "targetLabel": "formatWithQuotes", "expectLabel": "quoted:2024" }
  ]
}
```
否则 loop 的自动 spec 只会点击 `maxActionLabels` 个默认标签，不会覆盖新增按钮。

---

## 6. `styles` category 的 managed spec 是 static 类型，无法触发交互路径

**问题**：Loop 为 `CSSPropsTestPage`（`styles` category）生成的 managed spec 是 `static` 类型，只检查文字渲染，不执行 actionScripts 里的点击动作。`touchEnable` CSS prop handler 没有被触发，覆盖率无提升。

**原因**：`classification-policy.mjs` 把 `styles` category 的 managed spec 默认分类为 `static`。

**解决方案**：对于 `styles` 页面里含有**交互触发的 CSS prop**（如 `touchEnable`、`onClick` 相关），需要**手写一个 functional spec** 来触发这些路径：
```
web-autotest/tests/functional/css-props-functional.spec.ts
```
不要期望 managed static spec 能覆盖交互路径。

---

## 7. Loop 新页面 spec 在 build 之前生成导致 verify 失败并回滚

**问题**：带 `--max-rounds 3`（不含 `--skip-build`）运行 loop 时：
1. Preflight 阶段 scan 到新 Kotlin 页面 → 生成 spec → 立即 focused verify
2. Verify 失败（旧 bundle 里没有新页面，`page not found`）→ spec 被回滚
3. Build 成功，新页面进入 bundle
4. Round 2 不再为已回滚的页面重新生成 spec

**根因**：Preflight 的 spec 生成发生在 build 之前，新 carrier page 还未编译进 bundle。

**已修复**：`run-autotest-loop.mjs` 在 round 1（含 build）完成后，若 `skipBuild=false`，会重新 scan 并补生成 missingSpecs 的 managed spec。

**临时绕过方案**（修复前）：
```bash
# Step 1: 只做 build，不生成 spec
node web-autotest/scripts/loop/run-autotest-loop.mjs --max-rounds 1

# Step 2: build 已完成，用 skip-build 让 loop 生成 spec
node web-autotest/scripts/loop/run-autotest-loop.mjs --skip-build --max-rounds 3
```

---

## 8. `hasUsableInteractionHints()` 是旧模板遗留的死代码

**问题**：在早期版本的 `generate-carrier-page.mjs` 模板中，生成的 `auto-*.spec.ts` 文件里包含了如下守卫函数：

```typescript
function hasUsableInteractionHints() {
  return (Array.isArray(INTERACTION_HINTS.actionScripts) && INTERACTION_HINTS.actionScripts.length > 0)
    || ACTION_LABELS.length > 0
    || (INTERACTION_HINTS.actions || []).some((action) => action !== 'click-visible-labels');
}

// 在测试里
test('executes rule-driven interactions on ...', async ({ kuiklyPage }) => {
  test.skip(!hasUsableInteractionHints(), 'No usable interaction hints were resolved for this page.');
  // ...
});
```

**根因**：这个守卫的设计意图是跳过"没有任何可执行交互"的页面——但对于任何由 loop 实际生成的非空 spec，以下三个条件至少满足一个：
- `actionScripts.length > 0`（页面有 actionScripts）
- `ACTION_LABELS.length > 0`（页面有标签列表，即使标签可能是错误的动态模板字符串——见 §3）
- `actions` 里包含 `'scroll-first-list'` 或 `'fill-first-input'` 等非 `click-visible-labels` 项

因此 `hasUsableInteractionHints()` **结构性地永远返回 `true`**，`test.skip` 是永远不生效的 no-op 死代码。

**影响**：这些 spec 的"executes rule-driven interactions"测试表面上未被 skip（因为 `test.skip(false, ...)` 是 no-op），但在扫描 `test.skip` 列表时会产生误报，让人误以为它们是"因为缺少交互提示而被跳过的"。

**已修复（2026-05）**：以下 6 个生成的 spec 中的 `hasUsableInteractionHints()` 函数和对应的 `test.skip` 行均已删除：

| Spec 文件 | 修复内容 |
|-----------|---------|
| `tests/static/styles/auto-cssprops-test-page.spec.ts` | 删除函数 + skip 行；同时清空了错误的 `ACTION_LABELS`（见 §3） |
| `tests/functional/animations/auto-paganim-test-page.spec.ts` | 删除函数 + skip 行 |
| `tests/static/components/auto-krtext-area-view-test-page.spec.ts` | 删除函数 + skip 行 |
| `tests/static/components/auto-krtext-field-view-test-page.spec.ts` | 删除函数 + skip 行 |
| `tests/static/components/auto-modal-view-test-page.spec.ts` | 删除函数 + skip 行 |
| `tests/static/components/auto-krvideo-view-test-page.spec.ts` | 删除函数 + skip 行 |

`tests/functional/animations/auto-property-anim-test-page.spec.ts` 的 `hasUsableInteractionHints()` 函数定义也已删除（该函数在此文件中已无任何调用，属于孤立死代码）。

**规则**：
- 新生成的 `auto-*.spec.ts` 不应包含 `hasUsableInteractionHints()` 函数（当前模板版本已移除）。
- 如果在现有 managed spec 中发现此函数，直接删除函数体和调用它的 `test.skip` 行，无需其他改动。
- **不要**将此类 skip 归类为框架限制（见 `playwright-kuikly-limits.md`）——它不是 headless 问题，只是模板生成的死代码。
