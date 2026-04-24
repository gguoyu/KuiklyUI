# Failure Policy Reference

Use this reference after `analyze-playwright-results.mjs` has classified the failing tests.

## SCREENSHOT_DIFF

Update snapshots only when at least one of the following is true:
- the corresponding `web_test` page changed intentionally
- the rendered source object changed intentionally
- the diff is the expected result of a deliberate UI update

Escalate when:
- no relevant source change explains the diff
- the screenshot difference indicates visual regression or layout breakage

## ELEMENT_NOT_FOUND

Fix the spec when:
- the locator is stale
- the page still contains the behavior but the selector is too weak
- the test is missing a synchronization step

Escalate when:
- the page no longer renders the expected element due to product behavior
- the page itself is incomplete and the intended behavior is unclear

## ASSERTION_FAILED

Fix the spec when:
- the expected text or state is stale after an intentional change
- the test encoded the wrong expected value

Escalate when:
- the actual value indicates product logic drift
- changing the assertion would simply hide a bug

## PAGE_CRASH and TIMEOUT

First verify:
- the page exists under `web_test`
- `kuiklyPage.goto()` points to the right page
- the server and Kotlin runtime assets started correctly

Escalate when the runtime still crashes or hangs after those checks.

## Retry policy

- Re-run the smallest affected spec while iterating.
- Re-run the full suite before considering the issue resolved.
- Avoid blind repeated retries. A second failure with the same evidence should push you toward either a targeted fix or an explicit warning.
- For managed spec failures, follow the **Repair Ladder** below so repeated failures move toward lighter templates and then stop instead of looping forever.

---

## Repair Ladder

Use this when a managed spec fails and the loop must choose the next repair strength.

### Repair order

1. **Page-specific downgrade**
   - Prefer a page-specific lighter template when one exists and the failure evidence matches it.
2. **Category-generic downgrade**
   - If no page-specific repair is suitable, move to the category-level generic repair template.
3. **Generic smoke fallback**
   - If the category repair still fails or no longer changes the output, fall back to the lightest smoke-oriented template.
4. **Stop with blocker**
   - If the ladder is exhausted, stop mutating this page automatically and emit a blocker warning.

### Rules

- Each repair step should make the spec strictly simpler or more deterministic than the previous one.
- Do not loop forever on the same template profile and same failure evidence.
- If a lower step no longer changes the generated content, skip to the next allowed step or stop.
- Record the current repair step in managed metadata so later rounds can continue from the last safe downgrade point.

### Review question

For each repair step, ask:

> Did this step reduce uncertainty without throwing away the core behavior the page is supposed to cover?

If the answer is no, stop and escalate.
