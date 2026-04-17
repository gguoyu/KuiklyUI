# Workflow Reference

## Goal

Drive the current repository toward the AUTOTEST closed loop:
- run `web-e2e` tests through the canonical CLI
- output Kotlin coverage from V8 data
- identify broken cases
- auto-fix test issues when the evidence is clear
- warn instead of weakening tests when the failure points to product code
- add tests for low-coverage source objects until the thresholds pass or a real blocker is found

## Canonical commands

Run the full flow:

```bash
node web-e2e/scripts/kuikly-test.mjs --full
```

Rebuild coverage artifacts from existing `.v8_output`:

```bash
node web-e2e/scripts/coverage-report.mjs
node web-e2e/scripts/coverage-report.mjs --check
node web-e2e/scripts/coverage-js-no-sourcemap-report.mjs
```

Inspect completeness and analysis artifacts:

```bash
node kuikly-web-autotest/scripts/scan-web-test-pages.mjs
node kuikly-web-autotest/scripts/analyze-playwright-results.mjs
node kuikly-web-autotest/scripts/summarize-coverage.mjs
node kuikly-web-autotest/scripts/suggest-test-targets.mjs
node kuikly-web-autotest/scripts/build-autotest-report.mjs
```

## Practical loop

1. Run `scan-web-test-pages.mjs` before changing code.
2. If completeness already fails, fix that first.
3. Run `kuikly-test.mjs --full`.
4. If the test run fails, inspect `web-e2e/reports/test-results.json` via `analyze-playwright-results.mjs`.
5. Fix only issues that are clearly in test code, snapshot baselines, or missing coverage tests.
6. Re-run the narrowest affected test while iterating.
7. Re-run `--full` before considering the loop complete.
8. If coverage still fails, use `summarize-coverage.mjs` and `suggest-test-targets.mjs` to pick the next source object to target.

## What counts as a test issue

- locator no longer matches, but the page still exposes the same behavior
- assertion is stale after an intentional page change
- missing `waitForRenderComplete()` or similar synchronization
- new `web_test` page exists but no spec covers it yet
- low-coverage branch is clearly reachable through existing `web_test` interactions and only lacks a spec

## What counts as a code warning

- the rendered behavior contradicts the documented or existing stable expectation
- a branch is unreachable because the product implementation does not expose a path the test page claims to support
- the page crashes or fails to render due to runtime logic rather than test orchestration
- the only way to pass would be to remove a meaningful assertion or lower the threshold

## Current repo-specific facts

- `web-e2e/fixtures/test-base.ts` starts and stops Playwright V8 coverage for each test when `KUIKLY_COLLECT_V8_COVERAGE=true`.
- `web-e2e/scripts/coverage-report.mjs` reads `.v8_output`, filters coverage to `core-render-web/base` and `core-render-web/h5` Kotlin roots, and uses Monocart to emit HTML/LCOV/JSON reports.
- `web-e2e/scripts/coverage-report.mjs --check` enforces thresholds from `web-e2e/config/coverage.cjs` against the generated `coverage-summary.json` totals.
- `web-e2e/playwright.config.js` writes a JSON report to `web-e2e/reports/test-results.json`.
- `web_test` pages currently include components, styles, interactions, animations, composite, and modules categories.

## Cautions

- Do not treat the old `.codebuddy` rule file as authoritative over the actual repo state.
- Do not assume page-to-spec mappings from `AUTOTEST.md` are complete; scan the filesystem each time.
- Do not auto-update snapshots unless there is evidence that the UI change is intended.
