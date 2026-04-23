# Review Checklist Reference

Use this checklist after generating or repairing a managed spec.

## Read-before-write checks

- Read the target `web_test` page source before inventing interactions.
- If the spec is intended to improve coverage for a Kotlin runtime file, verify the page can actually trigger that behavior.
- Reuse nearby `web_test` patterns when adding a carrier page; do not invent new page conventions casually.

## Spec quality checks

- The spec should call `kuiklyPage.goto('<PageName>')`.
- The spec should wait for render before making assertions.
- The spec should use stable oracles: visible text, stable attributes, `data-kuikly-component`, bounding boxes, or screenshots.
- The spec should exercise a real behavior branch, not only add trivial visibility assertions.
- The spec should stay aligned with semantic intent: static vs functional vs visual.

## Low-confidence signals

Treat the generated spec as low confidence when:
- it depends only on `waitForTimeout()` without a stable post-wait assertion
- it has no meaningful `expect(...)` after an interaction
- it relies on high-index `nth(...)` selectors without page-specific justification
- it cannot explain which branch or behavior it is trying to cover

## Stop conditions

Stop and warn instead of forcing automation when:
- page behavior is ambiguous
- the carrier page is missing and nearby patterns do not make the expected behavior obvious
- the only possible assertion would hide a product bug rather than validate behavior
