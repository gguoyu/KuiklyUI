# Workflow Reference

## Goal

Drive the current repository toward the web-autotest closed loop:
- run `web-autotest` tests through the canonical CLI
- output Kotlin coverage from V8 data
- identify broken cases
- auto-fix test issues when the evidence is clear
- warn instead of weakening tests when the failure points to product code
- add tests for low-coverage source objects until the thresholds pass or a real blocker is found

## Canonical commands

Run the full flow:

```bash
node web-autotest/scripts/kuikly-test.mjs --full
```

Rebuild coverage artifacts from existing `.v8_output`:

```bash
node web-autotest/scripts/coverage-report.mjs
node web-autotest/scripts/coverage-report.mjs --check
node web-autotest/scripts/coverage-js-no-sourcemap-report.mjs
```

Inspect completeness and analysis artifacts:

```bash
node web-autotest/scripts/scan-web-test-pages.mjs
node web-autotest/scripts/analyze-playwright-results.mjs
node web-autotest/scripts/summarize-coverage.mjs
node web-autotest/scripts/suggest-test-targets.mjs
node web-autotest/scripts/build-autotest-report.mjs
```

## Practical loop

1. Run `scan-web-test-pages.mjs` before changing code.
2. If `nonWebTestSpecTargets` is non-empty, stop immediately: delete those specs or recreate the missing capability under `web_test` and retarget the spec.
3. If completeness already fails, fix that first.
4. Run `kuikly-test.mjs --full`.
5. If the test run fails, inspect `web-autotest/reports/test-results.json` via `analyze-playwright-results.mjs`.
6. Fix only issues that are clearly in test code, snapshot baselines, or missing coverage tests.
7. Re-run the narrowest affected test while iterating.
8. Re-run `--full` before considering the loop complete.
9. If coverage still fails, use `summarize-coverage.mjs` and `suggest-test-targets.mjs` to pick the next source object to target.
10. Before keeping a newly generated managed spec, run its focused rerun and roll it back if the rerun still fails.

## What counts as a test issue

- locator no longer matches, but the page still exposes the same behavior
- assertion is stale after an intentional page change
- missing `waitForRenderComplete()` or similar synchronization
- new `web_test` page exists but no spec covers it yet
- low-coverage branch is clearly reachable through existing `web_test` interactions and only lacks a spec
- a legacy spec needs to be migrated because the capability now has a proper `web_test` carrier

## What counts as a code warning

- the rendered behavior contradicts the documented or existing stable expectation
- a branch is unreachable because the product implementation does not expose a path the test page claims to support
- the page crashes or fails to render due to runtime logic rather than test orchestration
- the only way to pass would be to remove a meaningful assertion or lower the threshold

## Current repo-specific facts

- `web-autotest/fixtures/test-base.ts` starts and stops Playwright V8 coverage for each test when `KUIKLY_COLLECT_V8_COVERAGE=true`.
- `web-autotest/scripts/coverage-report.mjs` reads `.v8_output`, filters coverage to `core-render-web/base` and `core-render-web/h5` Kotlin roots, and uses Monocart to emit HTML/LCOV/JSON reports.
- `web-autotest/scripts/coverage-report.mjs --check` enforces thresholds from `web-autotest/config/coverage.cjs` against the generated `coverage-summary.json` totals.
- `web-autotest/playwright.config.js` writes a JSON report to `web-autotest/reports/test-results.json`.
- `web_test` pages currently include components, styles, interactions, animations, composite, and modules categories.

## Cautions

- Do not assume any hand-maintained page-to-spec mapping is complete; scan the filesystem each time.
- Prefer the skill-owned references and `web-autotest/rules/*.json` over ad-hoc heuristics when deciding how to generate or repair specs.
- Use `backfill-priority.md`, `feature-completeness.md`, and `testability-hard-rules.md` before generating a new managed spec for coverage backfill.
- Use `repair-ladder.md` and `classification-upgrade-rules.md` when a repaired spec starts to drift semantically.
- Do not auto-update snapshots unless there is evidence that the UI change is intended.
- Do not keep or repair specs that target pages outside `demo/.../pages/web_test/`; delete them or rebuild the capability under `web_test` first.
