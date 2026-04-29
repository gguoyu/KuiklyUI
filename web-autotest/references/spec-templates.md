# Spec Templates Reference

This document shows the canonical structure for each managed spec template profile.
Use this as the reference when generating or reviewing auto-generated specs.

All generated managed specs share the same runtime helper scaffold (helper functions defined at the
top of the file). Only the constant declarations, test cases, and page-specific logic differ between
template profiles.

---

## Common scaffold (all templates)

Every managed spec begins with a `@kuikly-autogen` metadata comment, imports, and five constant
blocks that the runtime helpers read at execution time.

```typescript
// @kuikly-autogen {"pageName":"...","category":"...","managedBy":"web-autotest","templateProfile":"...","targetClassification":"...","specLocation":"web-autotest/tests/..."}
import { test, expect } from '<relative-path-to>/fixtures/test-base';

const PAGE_NAME   = "<PageName>";
const TITLE_TEXT  = "<stable title visible on the page, or empty string>";
const STABLE_TEXTS: string[] = [ /* stable visible texts extracted from the page source */ ];
const ACTION_LABELS: string[] = [ /* stable clickable / actionable label texts */ ];
const INTERACTION_HINTS = { /* resolved from interaction-protocol.json for this page/category */ };
const ANIMATION_HINTS   = { /* resolved from animation-strategy.json for this page/category */ };
```

The runtime helpers (`expectPageReady`, `clickVisibleLabels`, `runActionScripts`,
`runRuleDrivenInteractions`, `waitForAnimationStrategy`, `hasUsableInteractionHints`) are identical
across all template profiles. Do not alter them unless the shared interaction model changes.

---

## Template: `interaction-generic`

**Category**: `interactions` (default for pages that expose stable action labels)
**Classification**: `functional`

**What it generates**:
- A `loads <PageName>` smoke test: goto → waitForRenderComplete → expectPageReady → component anchor visible
- An `executes rule-driven interactions` test: skipped when no usable hints; otherwise runs `runRuleDrivenInteractions` and asserts `actionCount > 0`

```typescript
test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(PAGE_NAME);
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('executes rule-driven interactions on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    test.skip(!hasUsableInteractionHints(), 'No usable interaction hints were resolved for this page.');
    await kuiklyPage.goto(PAGE_NAME);
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);
    const actionCount = await runRuleDrivenInteractions(kuiklyPage);
    expect(actionCount).toBeGreaterThan(0);
  });
});
```

**Key requirement**: `ACTION_LABELS` must contain at least one stable label, or `INTERACTION_HINTS.actionScripts` must be non-empty. Otherwise `hasUsableInteractionHints()` returns false and the second test is skipped.

---

## Template: `interaction-list-scroll`

**Category**: `interactions` (pages that expose `KRListView` with stable row text)
**Classification**: `functional`

**What it generates**: adds a third `scrolls and selects stable rows` test on top of the generic scaffold, using extracted stable row/group/selected-state texts as hard-coded constants.

```typescript
// Additional constants extracted from the page source:
const LIST_TITLE        = '<stable title text>';
const LIST_GROUP_ONE    = '<first group header text>';
const LIST_ITEM_ONE     = '<first item text>';
const LIST_ITEM_EIGHT   = '<eighth or mid-list item text>';
const LIST_SELECTED_ONE = '<selected-state text after clicking LIST_ITEM_ONE>';
// ...

async function listContainer(kuiklyPage) {
  return kuiklyPage.component('KRListView').first();
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  // test 1: loads (same as interaction-generic)
  // test 2: executes rule-driven interactions (same as interaction-generic)

  test('scrolls and selects stable rows on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(PAGE_NAME);
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(LIST_ITEM_ONE, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(LIST_SELECTED_ONE, { exact: true })).toBeVisible();

    const container = await listContainer(kuiklyPage);
    await kuiklyPage.scrollInContainer(container, { deltaY: 500, smooth: false });
    await expect(kuiklyPage.page.getByText(LIST_ITEM_EIGHT, { exact: true })).toBeVisible();
    // ... additional scroll depth assertions
  });
});
```

**Key requirement**: The page must expose stable row text and a selected-state text pattern. Without these the template falls back to `interaction-generic`.

---

## Template: `animation-generic`

**Category**: `animations`
**Classification**: `functional`

**What it generates**: same two-test scaffold as `interaction-generic`, but uses `ANIMATION_HINTS` to drive the wait strategy inside `waitForAnimationStrategy`.

The critical difference is in `ANIMATION_HINTS`:
- `preferredWait`: `"waitForAnimationEnd"` | `"waitForTransitionEnd"` | `"time-based-fallback"`
- `fallbackWaitMs` / `ciFallbackWaitMs`: used when the preferred wait is unavailable
- `preferStateAssertions`: when `true`, assert stable end-state text instead of screenshot

```typescript
test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(PAGE_NAME);
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('executes rule-driven interactions on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    test.skip(!hasUsableInteractionHints(), 'No usable interaction hints were resolved for this page.');
    await kuiklyPage.goto(PAGE_NAME);
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);
    const actionCount = await runRuleDrivenInteractions(kuiklyPage);
    expect(actionCount).toBeGreaterThan(0);
  });
});
```

**Key requirement**: `ACTION_LABELS` must name the animation trigger buttons (e.g. `"Play PAG"`, `"Pause at 20%"`). Without stable labels the second test is skipped.

---

## Template: `module-generic`

**Category**: `modules`
**Classification**: `functional`

**What it generates**: same two-test scaffold. The meaningful difference is in `INTERACTION_HINTS`:
- `postActionWaitMs` is typically longer (800ms) to allow async module responses to settle
- `ACTION_LABELS` names the module operation trigger buttons
- `maxActionLabels` is typically 2 to keep the generated spec conservative

```typescript
// Example constants for a module page:
const ACTION_LABELS = [
  "timestampToCalendar",
  "calendarToTimestamp",
  "addCalendar",
  "formatTimestamp"
];
const INTERACTION_HINTS = {
  actions: ["click-visible-labels"],
  maxActionLabels: 2,
  postActionWaitMs: 800,
  // ...
};
```

**Key requirement**: The module page must expose at least one trigger button whose label is stable. Module pages with only programmatic output (no visible trigger) need a page-specific `actionScripts` entry in `interaction-protocol.json`.

---

## Template: `static-generic` (components / styles)

**Category**: `components`, `styles`
**Classification**: `static`
**File suffix**: `*-static.spec.ts`

Unlike the functional templates, static specs do not use the shared runtime scaffold. They are
shorter, hand-structured, and contain only deterministic assertions.

```typescript
import { test, expect } from '<relative-path>/fixtures/test-base';

test.describe('Auto <PageName> static 验证', () => {
  test('should render <PageName> stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('<PageName>');
    await kuiklyPage.waitForRenderComplete();

    // Assert 2-4 stable visible texts extracted from the page source
    await expect(kuiklyPage.page.getByText('<stable text 1>', { exact: true }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('<stable text 2>', { exact: true }).first()).toBeVisible();
    // Component anchor
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
```

**Key requirements for components pages**:
- Assert the stable section headers or item texts visible in the initial render
- Assert at least one `data-kuikly-component` anchor
- Do not use screenshots unless the page is moved to `visual`

**Key requirements for styles pages**:
- Assert computed CSS properties (`toHaveCSS`) or stable style-label texts when available
- Prefer `toHaveCSS` assertions over pure `toBeVisible` when the page exists to verify style application

---

## Repair profiles

When a generated spec fails, the loop downgrades it according to `repair-ladder.json`:

| Step | Profile | What changes |
|------|---------|-------------|
| 1 | page-specific repair | Use the page's `repairProfiles` entry from `template-profiles.json` |
| 2 | category-generic repair | Replace complex interactions with `click-visible-labels` only |
| 3 | generic-smoke | Strip all interactions; keep only `loads` test with `expectPageReady` |
| 4 | blocker | Stop mutating; emit manual-review warning |

The `repairStep` counter in the `@kuikly-autogen` metadata tracks the current rung so that
subsequent rounds continue from where the previous one stopped.

---

## Test file organization rules

These rules govern when to create new spec files vs. adding tests to existing files. Follow them strictly to prevent file proliferation and redundancy.

### Rule 1: Check before creating — no duplicate coverage

Before creating a new spec file for a TestPage, **search existing specs** to confirm no file already tests that page:

```bash
grep -rl "goto('TargetPageName')" web-autotest/tests/
```

If a spec already exists for that page in the same classification (functional/static/visual), **add tests to the existing file** instead of creating a new one.

### Rule 2: One TestPage = one functional spec

Each TestPage should have at most **one** functional spec file. Do not split a page's functional tests across multiple files unless they genuinely test different aspects that would make a single file exceed ~300 lines.

| Correct | Incorrect |
|---------|-----------|
| `calendar-functional.spec.ts` (all calendar tests) | `calendar-branches.spec.ts` + `calendar-coverage.spec.ts` + `calendar-precision.spec.ts` |

### Rule 3: Auto-generated specs must not overlap with handwritten specs

If a handwritten spec already covers a TestPage (static, functional, or visual), **do not generate an auto-spec for the same page and classification**. The handwritten spec is always preferred because it has more precise assertions.

Check before generating:
```bash
grep -rl "goto('TargetPageName')" web-autotest/tests/static/
grep -rl "goto('TargetPageName')" web-autotest/tests/functional/
```

### Rule 4: Minimum viable spec size

Do not create a spec file with only 1 test that merely verifies page loading (`goto` + `toBeVisible`). Instead:
- If a functional spec already exists for that page, the page-load check is redundant (the functional spec's `beforeEach` or first test already does it).
- If no spec exists yet, include at least 2 meaningful assertions beyond page loading.

### Rule 5: Static specs should not repeat functional coverage

A static spec should only exist when it tests something the functional spec does **not** cover (e.g., initial DOM structure, CSS computed properties, component count). If the functional spec already verifies page loading and element visibility, a separate static spec that only checks `toBeVisible()` is redundant.

### Rule 6: File naming conventions

| Type | Directory | Naming pattern | Example |
|------|-----------|---------------|---------|
| Functional | `tests/functional/` | `<feature>-functional.spec.ts` | `modal-functional.spec.ts` |
| Functional (component) | `tests/functional/components/` | `<component>-functional.spec.ts` | `krhoverview-functional.spec.ts` |
| Functional (module) | `tests/functional/modules/` | `<module>-functional.spec.ts` | `calendar-functional.spec.ts` |
| Static | `tests/static/` | `<feature>-static.spec.ts` | `form-static.spec.ts` |
| Visual | `tests/visual/` | `<feature>-visual.spec.ts` | `modal-visual.spec.ts` |
| Auto-generated | same as above | `auto-<page>-test-page.spec.ts` | `auto-krvideo-view-test-page.spec.ts` |

### Rule 7: When merging is required

Merge spec files when:
- Multiple files test the same TestPage in the same classification
- A spec file has only 1-2 tests and can logically fit into a related file
- An auto-generated spec exists alongside a handwritten spec for the same page
