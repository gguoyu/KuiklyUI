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
