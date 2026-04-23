# Feature Completeness Reference

Use this reference after a page has been selected for AI backfill.

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
