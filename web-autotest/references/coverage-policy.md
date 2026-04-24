# Coverage Policy Reference

## Thresholds

- lines >= 70
- functions >= 70
- statements >= 70
- branches >= 55

These values come from `web-autotest/config/coverage.cjs`. HTML/LCOV/JSON coverage artifacts are generated through `web-autotest/scripts/coverage-report.mjs` from `.v8_output`, and the thresholds are enforced through `web-autotest/scripts/coverage-report.mjs --check`.

## Scope

Coverage is intentionally filtered to Kotlin files under:
- `core-render-web/base/src/jsMain/kotlin`
- `core-render-web/h5/src/jsMain/kotlin`

Do not assume that other Kotlin modules are part of the enforcement scope unless the coverage script changes.

## How to choose new tests

1. Start with the lowest-coverage file from `coverage-final.json`.
2. Look at uncovered branch, statement, and line counts rather than only percentages.
3. Map the file back to the nearest runtime concern:
   - component rendering
   - module behavior
   - interaction branch
   - animation branch
   - host/runtime behavior
4. Find an existing `web_test` page that can trigger that behavior.
5. Rank candidate pages using the **Backfill Priority** rules below before choosing one to extend.
6. Reject pages that fail the **Spec quality gates** in `feature-completeness.md` before writing the spec.
7. If no suitable page exists, add a dedicated `web_test` page before writing the spec.
8. Never point a new or migrated spec at a non-`web_test` page just to recover coverage.

## Good targets in the current repo

- branch-oriented interaction pages such as `EventCaptureTestPage`, `GestureTestPage`, and `PageListTestPage`
- module pages under `demo/.../web_test/modules/`
- component pages that already expose multiple variants but lack explicit branch assertions

## Bad coverage fixes

- adding trivial assertions that do not execute new code paths
- lowering thresholds
- changing the coverage script scope to hide real gaps
- deleting meaningful tests to remove failures
- adding or keeping specs that target pages outside `demo/.../pages/web_test/`

## Final gate

Coverage work is complete only when the canonical full run passes, the Monocart Kotlin report is generated successfully from V8 data, and `coverage-report.mjs --check` succeeds.

---

## Backfill Priority

Use this when coverage is below threshold and the loop must decide what to extend next.

### Priority order

1. **Completeness gaps first**: pages under `web_test` without any spec are higher priority than pure coverage tuning.
2. **Reachable coverage gaps second**: prefer low-coverage source objects that already map to an existing, usable carrier page.
3. **New carrier pages last**: only add a carrier page when nearby `web_test` patterns already make the intended behavior obvious.
4. **Stop instead of guessing**: if the missing behavior is ambiguous, emit a manual-review warning instead of inventing page semantics.

### Candidate scoring dimensions

When choosing among multiple reachable coverage targets, prefer the page that has more of the following:
- a larger uncovered branch / line / statement gap
- a higher-value category (`interactions`, `modules`, then `animations`, then `composite`)
- stable visible text or stable state text that can act as a post-action oracle
- explicit action scripts or deterministic input / scroll paths
- no handwritten blocker spec for the same page
- no known flakiness marker

### De-prioritize or stop when

- the page only offers smoke-level visibility assertions and no meaningful post-action oracle
- the page depends on ambiguous geometry or runtime internals to prove behavior
- the page is already marked as blocked by a handwritten spec
- the page requires a brand new carrier but nearby repo patterns do not define the behavior clearly enough

### Decision outputs

Every automated backfill choice should be explainable in these terms:
- why this page was chosen over the other candidates
- which stable oracle proves the target behavior
- whether the result is expected to improve completeness, reachable coverage, or both
- why the loop did not create a new carrier page if one was missing
