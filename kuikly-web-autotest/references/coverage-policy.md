# Coverage Policy Reference

## Thresholds

- lines >= 70
- functions >= 70
- statements >= 70
- branches >= 55

These values come from `web-e2e/.nycrc.json` and are enforced through `web-e2e/scripts/coverage-report.mjs --check`.

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
5. If none exists, add a dedicated `web_test` page before writing the spec.

## Good targets in the current repo

- branch-oriented interaction pages such as `EventCaptureTestPage`, `GestureTestPage`, and `PageListTestPage`
- module pages under `demo/.../web_test/modules/`
- component pages that already expose multiple variants but lack explicit branch assertions

## Bad coverage fixes

- adding trivial assertions that do not execute new code paths
- lowering thresholds
- changing the coverage script scope to hide real gaps
- deleting meaningful tests to remove failures

## Final gate

Coverage work is complete only when the canonical full run passes and `coverage-report.mjs --check` succeeds.
