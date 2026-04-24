# Interaction Protocol Reference

Use this reference when generating or repairing specs that need interaction-driven coverage.

## Canonical action model

Prefer composing specs from these action types:
- `click`
- `input`
- `scroll`
- `swipe`
- `waitForRender`
- `wait`
- `assert`
- `snapshot`

The loop does not need a heavyweight DSL in the generated spec, but the chosen interactions should map back to one of these action types.

## Selector priority

Prefer selectors in this order:
1. stable visible text
2. `data-kuikly-component`
3. stable labels / stable attributes
4. bounding-box or coordinate fallback only when a page-specific template already proves that is necessary

Do not generate assertions from runtime internals, obfuscated names, or temporary debug objects.
If a page cannot satisfy these selector rules with a stable post-action oracle, treat it as failing the testability hard rules in `feature-completeness.md` and stop.

## Component-driven interaction hints

- `KRListView`: prefer scroll + stable row visibility assertions; if selection text exists, click a stable row and assert the selected state.
- `KRInputView`: prefer focus + fill + stable echoed text or state assertion.
- `KRScrollView`: prefer a deterministic scroll step plus a visible-state assertion after scrolling.
- `KRView` / button-like clickable groups: prefer clicking stable action labels and asserting a visible state change.
- module pages: prefer action labels that produce stable output text rather than only waiting on timing.

## Scenario patterns

### Click-driven pages
- wait for initial render
- assert page-ready text
- click one or more stable labels
- wait for render again
- assert visible state change

### Input-driven pages
- wait for initial render
- focus the first stable input
- fill deterministic text
- assert visible echoed content, value, or state text

### Scroll-driven pages
- wait for initial render
- locate the first stable scroll container
- perform deterministic scroll delta
- assert newly visible content or changed scroll position

### Swipe-driven pages
- use only when the page clearly represents pager-like behavior
- prefer a dedicated page template over a generic swipe helper when the assertions depend on geometry or tab state

## Escalation

Stop instead of guessing when:
- action labels are ambiguous
- the page exposes no stable post-interaction oracle
- the only available assertion would depend on internal runtime state instead of rendered output

---

## Animation Strategy

Use this when generating or repairing animation-oriented specs.

### Animation families

- **CSS transition**: trigger a state change, then prefer an end-state wait or end-state assertion.
- **JS frame animation**: prefer stable end-state assertions; use frame-sensitive logic only for page-specific templates that already expose strong signals.
- **KR property animation**: prefer trigger -> wait -> visible end-state or toggle-state assertions.
- **PAG / canvas animation**: prefer page-specific templates and visible rendering evidence instead of fragile pixel-perfect timing in generic repairs.

### Preferred assertion strategy

1. First choice: stable state text, stable style state, or deterministic visible end state.
2. Second choice: screenshot or frame-based validation only when the page is explicitly built for visual validation.
3. CI fallback: when timing is unstable, prefer simpler end-state checks over frame-sensitive checks.

### Practical rules for generated specs

- Keep generic animation repairs conservative.
- Prefer one trigger + one stable end-state assertion over long animation scripts.
- If the page already has a page-specific template, keep using it; only downgrade to a lighter repair profile when failures show the richer path is unstable.
- When a page does not expose a stable animation oracle, emit a manual-review warning instead of inventing one.

### CI stability

When `process.env.CI === 'true'`:
- prefer shorter waits and stable end-state assertions
- avoid relying purely on frame counts or precise animation timing in generic templates
- keep page-specific visual templates only where the page already exposes deterministic checkpoints
