# Feature Completeness Reference

Use this reference after a page has been selected for AI backfill, and before keeping a generated or repaired spec.

## Minimum expectation by scenario

### Click-driven pages
A useful functional spec should include:
- an initial page-ready assertion
- at least one deterministic click action
- a stable post-click state assertion
- evidence that the click changed behavior, not only that the page stayed visible

### Input-driven pages
A useful functional spec should include:
- a deterministic input value
- a stable value / echo / validation-state assertion after input
- at least one assertion tied to the resulting state, not only the existence of the input element

### Scroll-driven pages
A useful functional spec should include:
- identification of a stable scroll container
- a deterministic scroll step
- a post-scroll assertion such as new visible content or scroll position change

### Module-driven pages
A useful functional spec should include:
- an action that triggers module behavior
- a stable result text / status / rendered output assertion
- at least one assertion that proves the module path completed, not only that the trigger was clicked

### Animation-driven pages
A useful functional or hybrid spec should include:
- a stable pre-animation state
- a deterministic trigger
- an animation wait strategy
- a stable end-state or visual oracle

### Component-display pages (`components` category)

A useful static spec should include:
- `kuiklyPage.goto` + `waitForRenderComplete`
- at least 2 stable visible text assertions drawn from the page's section headers or item texts
- at least one `data-kuikly-component` anchor assertion
- do not use screenshots unless the page is intentionally moved to `visual`

### Style-display pages (`styles` category)

A useful static spec should include:
- `kuiklyPage.goto` + `waitForRenderComplete`
- at least one `toHaveCSS` assertion on a key style property, or at least 2 stable visible text labels naming the style variant
- do not treat a style spec as complete if it only asserts `toBeVisible` with no style verification

## Smoke-only patterns to reject

Treat the generated spec as insufficient for coverage backfill when:
- it only proves the page loads
- it only counts actions without asserting a meaningful state change
- it clicks a visible label but has no post-action oracle
- it depends on a timeout and then reasserts the original page title only

## Review question

For every generated backfill spec, ask:

> If this spec passed, what exact behavior branch would we now be more confident about?

If that question cannot be answered in one sentence, the spec is too weak for AI-driven coverage backfill.

---

## Testability Hard Rules

Use these before creating or refreshing a managed spec.

### Stable oracle requirements

A page is not eligible for automatic backfill unless it exposes at least one stable oracle:
- stable page title or stable visible text
- stable action result text
- stable `data-kuikly-component` anchor used together with a deterministic state assertion
- a page-specific scripted interaction with an explicit expected label

### Actionability requirements

For interaction-oriented automatic backfill, the page must expose at least one usable action path:
- explicit action scripts with expected results
- deterministic input flow
- deterministic scroll flow
- stable visible labels that map to a known state change

A page that only offers a clickable surface without a stable post-action oracle should be skipped.

### Hard stop cases

Stop and warn instead of generating a managed spec when:
- the page has no stable oracle
- the page has no usable action path for its category
- the page has no stable post-action outcome
- the page is marked as known-flaky and has no page-specific repair strategy
- the only proof would rely on runtime internals, obfuscated names, or ad-hoc debug objects

---

## Spec Review Checklist

Use this after generating or repairing a managed spec.

### Read-before-write checks

- Read the target `web_test` page source before inventing interactions.
- If the spec is intended to improve coverage for a Kotlin runtime file, verify the page can actually trigger that behavior.
- Reuse nearby `web_test` patterns when adding a carrier page; do not invent new page conventions casually.

### Spec quality checks

- The spec should call `kuiklyPage.goto('<PageName>')`.
- The spec should wait for render before making assertions.
- The spec should use stable oracles: visible text, stable attributes, `data-kuikly-component`, bounding boxes, or screenshots.
- The spec should exercise a real behavior branch, not only add trivial visibility assertions.
- The spec should stay aligned with semantic intent: static vs functional vs visual.
- If a spec appears to satisfy a higher semantic level, flag it with `classification-upgrade-rules.md` instead of silently keeping the lower classification.

### Low-confidence signals

Treat the generated spec as low confidence when:
- it depends only on `waitForTimeout()` without a stable post-wait assertion
- it has no meaningful `expect(...)` after an interaction
- it relies on high-index `nth(...)` selectors without page-specific justification
- it cannot explain which branch or behavior it is trying to cover
- it matches a known bad pattern from `anti-patterns-catalog.md`

### Stop conditions

Stop and warn instead of forcing automation when:
- page behavior is ambiguous
- the carrier page is missing and nearby patterns do not make the expected behavior obvious
- the only possible assertion would hide a product bug rather than validate behavior
