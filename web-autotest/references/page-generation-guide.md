# Page Generation Guide

Use this reference when `generate-carrier-page.mjs` needs to create a new `web_test` Kotlin
carrier page, or when an AI agent is asked to write one manually.

A carrier page exists to make a Kotlin source behavior testable. It must expose at least one
stable oracle (visible text that changes with state) and at least one actionable path (a button
or trigger that causes that change). Pages that only show a title are not acceptable.

---

## 1. Kotlin DSL skeleton (all types)

Every carrier page follows this skeleton:

```kotlin
package <webTestPackagePrefix>.<category>

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
// Add other imports as needed (observable, List, Text, View, Button, Image, ...)

/**
 * <SourceFileName> test page
 *
 * Tests covered:
 * 1. <brief description of section 1>
 * 2. <brief description of section 2>
 */
@Page("<PageName>")
internal class <PageName> : Pager() {

    // Reactive state — one observable per behavior being tested
    private var <stateName> by observable(<initialValue>)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }

                // === Section 1: <section title> ===
                Text {
                    attr {
                        text("1. <section title>")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // <interactive element(s) for this section>

                // Bottom spacing
                View { attr { height(50f) } }
            }
        }
    }
}
```

**Key rules:**
- Always wrap the body in a `List` with `flex(1f)` for scrollability
- Use section header `Text` nodes with numbered prefixes (`"1. ..."`, `"2. ..."`) — these become `STABLE_TEXTS`
- Always add a bottom `View` with `height(50f)` for spacing
- Never import network dependencies unless the page is specifically a module test

---

## 2. The state-driven text pattern (critical for auto-spec generation)

This is the single most important pattern. It makes button labels themselves carry the expected
state, so the generated spec can assert `targetLabel → expectLabel` transitions automatically.

```kotlin
// State variable
private var clickCount by observable(0)

// Button whose text IS the state
Button {
    attr {
        titleAttr {
            text(
                when {
                    ctx.clickCount == 0 -> "before-state"   // targetLabel
                    ctx.clickCount == 1 -> "after-state-1"  // expectLabel
                    else               -> "after-state-2"
                }
            )
        }
    }
    event { click { ctx.clickCount = minOf(ctx.clickCount + 1, 2) } }
}
```

Or with a boolean toggle (simpler, preferred for binary behaviors):

```kotlin
private var isActive by observable(false)

View {
    event { click { ctx.isActive = !ctx.isActive } }
    Text {
        attr {
            text(if (ctx.isActive) "active-label" else "inactive-label")
        }
    }
}
```

The pattern produces a `targetLabel → expectLabel` pair that `interaction-protocol.json` can record:
```json
{ "kind": "click", "targetLabel": "inactive-label", "expectLabel": "active-label" }
```

**Rule: every interactive section must have at least one state-driven text change.**

---

## 3. Type-specific patterns

### 3a. `interactions` category

Use for pages that test click, long-press, double-click, scroll, or swipe behavior.

**Minimum content:**
- At least 2 interactive sections
- Each section: one trigger element + one state-driven text oracle
- State text must change visibly after the action

```kotlin
// Click toggle
private var toggleState by observable(false)
// Long press
private var longPressed by observable(false)

// Section 1: Click
View {
    event { click { ctx.toggleState = !ctx.toggleState } }
    Text { attr { text(if (ctx.toggleState) "clicked" else "not-clicked") } }
}

// Section 2: Long press
View {
    event { longPress { ctx.longPressed = !ctx.longPressed } }
    Text { attr { text(if (ctx.longPressed) "long-pressed" else "press-and-hold") } }
}
```

**actionScripts output:**
```json
[
  { "kind": "click",      "targetLabel": "not-clicked",  "expectLabel": "clicked" },
  { "kind": "long-press", "targetLabel": "press-and-hold","expectLabel": "long-pressed" }
]
```

---

### 3b. `components` category

Use for pages that verify a component renders its visual properties correctly.
These pages are primarily for `static` specs (no interaction required).

**Minimum content:**
- Multiple sections, each demonstrating a distinct property variant
- Section header texts are the stable oracles (`STABLE_TEXTS`)
- No interaction needed; the page just needs to render correctly

```kotlin
// No observable state needed for pure visual pages

// Section 1: different sizes
Text { attr { text("1. 不同尺寸") ... } }
View {
    attr { flexDirectionRow(); padding(all = 16f) }
    View { attr { size(40f, 40f); backgroundColor(0xFF4CAF50) } }
    View { attr { size(80f, 80f); backgroundColor(0xFF2196F3); marginLeft(12f) } }
}

// Section 2: different colors
Text { attr { text("2. 不同背景色") ... } }
// ...
```

**For components that have interactive props** (e.g. load success/failure callbacks),
add a section that triggers the behavior and shows a result text:

```kotlin
private var imageLoaded by observable(false)

Image {
    attr { src("https://example.com/test.png") }
    event {
        onLoadSuccess { ctx.imageLoaded = true }
        onLoadFailure { ctx.imageLoaded = false }
    }
}
Text { attr { text(if (ctx.imageLoaded) "image-loaded" else "image-loading") } }
```

---

### 3c. `styles` category

Use for pages that verify CSS-mapped style properties render correctly.
These pages target `static` or `visual` specs.

**Minimum content:**
- One section per style property being tested
- Each section shows multiple variant values side by side
- Use text labels inside or below each variant to name the value being shown

```kotlin
// Section 1: opacity variants
Text { attr { text("1. 透明度梯度") ... } }
View {
    attr { flexDirectionRow(); justifyContentSpaceAround() }
    // Each block shows a labeled opacity value
    View {
        attr { size(50f, 50f); backgroundColor(0xFF1976D2); opacity(0.2f); allCenter() }
        Text { attr { text("0.2"); fontSize(12f); color(Color.WHITE) } }
    }
    View {
        attr { size(50f, 50f); backgroundColor(0xFF1976D2); opacity(1.0f); allCenter() }
        Text { attr { text("1.0"); fontSize(12f); color(Color.WHITE) } }
    }
}
```

The inline labels (`"0.2"`, `"1.0"`, `"solid"`, `"dashed"`) become `STABLE_TEXTS` that
the static spec can assert.

---

### 3d. `modules` category

Use for pages that test KuiklyUI module methods (Notify, Codec, Calendar, Network, etc.).

**Minimum content:**
- One trigger button per module method being tested
- A result text area that changes after the method completes
- State-driven text pattern required (same as interactions)

```kotlin
private var sendCount by observable(0)

// Trigger button — text is the stable action label
View {
    attr { accessibility("send") }
    event {
        click {
            ctx.sendCount += 1
            ctx.acquireModule<NotifyModule>(NotifyModule.MODULE_NAME)
                .postNotify("test_event", JSONObject().apply { put("count", ctx.sendCount) })
        }
    }
    Text { attr { text("send") } }
}

// Result area — text changes with state → this is the expectLabel
Text { attr { text("count:${ctx.sendCount}") } }
```

**actionScripts output:**
```json
[
  { "kind": "click", "targetLabel": "send", "expectLabel": "count:1" }
]
```

Note: for count-based expected values, the `expectLabel` should be the value after the
**first** invocation (e.g. `"count:1"`, not `"count:${n}"`).

---

### 3e. `animations` category

Use for pages that test CSS transition, JS frame animation, property animation, or PAG.

**Minimum content:**
- One trigger button per animation scenario
- A state text that reflects the animation's end state (not timing-dependent)
- Prefer state text over screenshots for generated specs

```kotlin
private var isExpanded by observable(false)

// Trigger
View {
    event { click { ctx.isExpanded = !ctx.isExpanded } }
    Text { attr { text("Click Me") } }
}

// State text — this is the stable oracle
Text {
    attr {
        text(if (ctx.isExpanded) "已展开 (200x200)" else "未展开 (100x100)")
    }
}
```

The animated element itself changes size/color/position, but the **state text** is what the
spec asserts (stable, not pixel-dependent).

---

## 4. Mapping a source file to page content

When reading a source file to write a carrier page, extract the following from the Kotlin source:

| What to look for | How to use in the page |
|-----------------|------------------------|
| `when (propKey)` branches | Each prop key → one section demonstrating that prop's variants |
| `KRCssConst.*` / `KREventConst.*` refs | CSS props / event types exposed by the component |
| `event { click { ... } }` | Add a click trigger with state-driven text |
| `event { longPress { ... } }` | Add a long-press trigger with state-driven text |
| `override fun call(method, ...)` branches | Each module method → one trigger button + result text |
| Class name suffix | `KRXxxView` → components; `KRXxxModule` → modules; list/scroll → interactions; anim → animations |

**Props-to-sections mapping example** for `KRImageView` with props `[src, resize, tintColor, blurRadius]`:

```
Section 1: resizeContain / resizeCover / resizeStretch
Section 2: different image sizes
Section 3: borderRadius variants
Section 4: tintColor application
Section 5: blur radius variants
```

---

## 5. Naming and file placement

| Field | Rule |
|-------|------|
| Page class name | `<SubjectName>TestPage` — derived from source file name |
| `@Page` annotation | Same as class name |
| File path | `<webTestRoot>/<category>/<PageName>.kt` |
| Package | `<webTestPackagePrefix>.<category>` |

Examples:
- `KRHoverView.kt` → `KRHoverViewTestPage` → `components/KRHoverViewTestPage.kt`
- `KRCalendarModule.kt` → `CalendarModuleTestPage` → `modules/CalendarModuleTestPage.kt`
- `H5ListView.kt` → `ListScrollTestPage` → `interactions/ListScrollTestPage.kt`

---

## 6. Self-check before writing the page

Answer yes to all before generating:

1. Does every interactive section have a **state-driven text change** that the spec can assert?
2. Are section header texts numbered (`"1. ..."`) and stable (not dynamic)?
3. Does the page avoid network calls, localStorage, or external SDK unless that IS what is being tested?
4. Can every button's expected result be expressed as a **visible text** (not a pixel check)?
5. Would a generated spec for this page be able to answer: *"what behavior branch am I now more confident about?"*

If any answer is no, revise the page design before writing the file.

---

## 7. Carrier page design principles

### Core principles

- **Single responsibility**: each test page should focus on one component, one style family, or one narrow interaction scenario.
- **Deterministic content**: prefer fixed text, fixed item counts, fixed image URLs, and embedded data over network-driven or random content.
- **Stable layout**: keep geometry and visual hierarchy predictable so assertions and screenshots remain durable.
- **No external dependencies**: avoid network requests, local storage dependencies, and other non-essential runtime coupling unless the page explicitly exists to test that module behavior.
- **Direct accessibility**: every page must be routable through `kuiklyPage.goto('<PageName>')`.

### Carrier page rules

- `web-autotest/tests/` must target only pages registered under `demo/.../pages/web_test/`.
- If no existing `web_test` carrier can express the missing capability, add a carrier page before adding the spec.
- Do not create placeholder carrier pages that only show a title and do not expose the missing behavior itself.
- If the intended page behavior is still ambiguous after reading nearby `web_test` patterns and the source file under test, stop and emit a manual-review warning.

### What a good page exposes

A good carrier page gives the loop at least one of the following:
- stable title text
- stable visible content text
- stable action labels
- stable `data-kuikly-component` nodes
- stable state transitions after a click / input / scroll

### Review questions

Before keeping a new carrier page, confirm:
- Does the page cover a real missing capability rather than duplicate an existing carrier?
- Can the spec interact with it using stable selectors and stable oracles?
- Does it avoid unnecessary business logic and unrelated branches?
