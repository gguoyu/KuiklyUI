# Anti-Patterns Catalog Reference

Use this reference when reviewing generated specs or adding new validation rules.

## High-confidence anti-patterns

### Timeout without meaningful outcome
- Symptom: waits with `waitForTimeout()` and then only reasserts a page title or other unchanged text.
- Why it is bad: hides flaky timing instead of proving behavior.

### Action without stable result
- Symptom: clicks / fills / scrolls, but the only final assertion is `actionCount > 0` or the original ready state.
- Why it is bad: proves that an action happened, not that the target behavior changed.
- Machine-readable rule: not yet encoded in `anti-examples.json`; flag manually during review.

### Runtime-internal oracle
- Symptom: assertions depend on obfuscated exports, debug-only globals, or temporary runtime artifacts.
- Why it is bad: rebuilds or minification can invalidate the oracle without changing product behavior.

### Brittle selector overuse
- Symptom: relies on high-index `nth(...)`, coordinate-only targeting, or ad-hoc geometry when stable text / labels already exist.
- Why it is bad: the spec becomes fragile to harmless layout changes.

### Parallel managed spec over handwritten blocker
- Symptom: the loop generates a managed coverage spec even though a handwritten spec already marks the page as blocked or pending at page level.
- Why it is bad: creates contradictory sources of truth and hides the real blocker.
- Machine-readable rule: not yet encoded in `anti-examples.json`; the loop enforces this via `testability-rules.json` `hardBlockers`.

## Rule-writing guideline

Only promote an anti-pattern into a hard rule when it is both:
- high confidence
- low false-positive for the current repo

### Redundant spec file for already-covered page
- Symptom: a new auto-generated or handwritten spec file is created for a TestPage that already has a spec in the same classification (static/functional/visual).
- Why it is bad: creates duplicate page loads and overlapping assertions, increasing CI time without coverage gain. When the page changes, multiple files must be updated.
- Rule: before creating any spec file, `grep -rl "goto('PageName')" tests/` to check for existing coverage. Add tests to the existing file instead.

### Single-test page-load-only spec
- Symptom: a spec file contains only one test that does `goto()` + `waitForRenderComplete()` + a single `toBeVisible()` assertion.
- Why it is bad: this is already covered by the `beforeEach` or first test of any functional spec for the same page. The file adds CI overhead with no unique value.
- Rule: do not create standalone page-load specs. If no functional spec exists yet, write at least 2 meaningful assertions.

### Split functional specs for the same page
- Symptom: the same TestPage has multiple functional spec files testing different aspects (e.g., `calendar-branches.spec.ts`, `calendar-coverage.spec.ts`, `calendar-precision.spec.ts`).
- Why it is bad: each file re-loads the page independently, multiplying test time. Logically related tests should share `beforeEach` navigation.
- Rule: consolidate into one `<feature>-functional.spec.ts` per TestPage. Use `test.describe` blocks within the file to group sub-topics.
