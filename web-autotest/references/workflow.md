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
node web-autotest/scripts/loop/scan-web-test-pages.mjs
node web-autotest/scripts/loop/analyze-playwright-results.mjs
node web-autotest/scripts/loop/summarize-coverage.mjs
node web-autotest/scripts/loop/suggest-test-targets.mjs
```

## Practical loop

1. Run `scan-web-test-pages.mjs` before changing code.
2. If `nonWebTestSpecTargets` is non-empty, stop immediately: delete those specs or recreate the missing capability under `web_test` and retarget the spec.
3. If completeness already fails (`missingSpecCount > 0`), fix that first.
4. If `sourceFilesWithoutPage` is non-empty, handle carrier page gaps — see **Carrier page generation** below.
5. Run `kuikly-test.mjs --full`.
6. If the test run fails, inspect `web-autotest/reports/test-results.json` via `analyze-playwright-results.mjs`.
7. Fix only issues that are clearly in test code, snapshot baselines, or missing coverage tests.
8. Re-run the narrowest affected test while iterating.
9. Re-run `--full` before considering the loop complete.
10. If coverage still fails, use `summarize-coverage.mjs` and `suggest-test-targets.mjs` to pick the next source object to target.
11. Before keeping a newly generated managed spec, run its focused rerun and roll it back if the rerun still fails.

## When to use `--skip-build`

`--skip-build` skips the Kotlin/JS Gradle build and reuses the last compiled bundle.

**Safe to use `--skip-build` when:**
- No new Kotlin carrier pages (`.kt` files) have been added to `web_test/` since the last build.
- Changes are limited to TypeScript spec files, `rules/*.json`, or other non-Kotlin files.
- You are iterating quickly on spec repairs or coverage spec generation against existing pages.

**Do NOT use `--skip-build` when:**
- A new Kotlin carrier page was written to `web_test/` — it must be compiled into the JS bundle before Playwright can load it.
- An existing Kotlin carrier page was modified (e.g. UI text changed to English).

If `--skip-build` is used after adding a new carrier page, the loop will generate a managed spec for that page, the focused verification run will fail with "page not found" (because the page is not yet in the bundle), and the spec will be rolled back immediately.

## Carrier page generation

When `scan-web-test-pages.mjs` reports `sourceFilesWithoutPage`, source files under `sourceRoots`
have no matching `web_test` carrier page. All these files are render-layer implementations
without state-driven text, so the loop emits `carrier-page-needed` signals — the AI must
write each carrier page from scratch.

**AI carrier page workflow:**
1. Read the source file to understand its props, events, and behaviors.
2. Read `references/page-generation-guide.md` for the Kotlin DSL patterns.
3. Write a carrier page with the **state-driven text pattern** — every testable behavior must have a button whose label changes after the action, so specs can assert the state change.
4. Write the Kotlin file to the `targetPath` from the warning.
5. Run `generate-carrier-page.mjs <source-file> --write` to update `interaction-protocol.json`.

**Stop and emit a manual-review warning** when:
- The source file is internal infrastructure (scheduler, serializer, DOM utils) with no user-facing behavior.
- The behavior requires external SDK or network access that cannot be simulated deterministically.

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
- `web-autotest/scripts/coverage-report.mjs` reads `.v8_output`, filters coverage to the Kotlin source roots listed in `scopeRoots` inside `kuikly.autotest.config.cjs`, and uses Monocart to emit HTML/LCOV/JSON reports.
- `web-autotest/scripts/coverage-report.mjs --check` enforces thresholds from `web-autotest/config/coverage.cjs` against the generated `coverage-summary.json` totals.
- `web-autotest/playwright.config.js` writes a JSON report to `web-autotest/reports/test-results.json`.
- `web_test` pages currently include components, styles, interactions, animations, composite, and modules categories.

## Cautions

- Do not assume any hand-maintained page-to-spec mapping is complete; scan the filesystem each time.
- Prefer the skill-owned references and `web-autotest/rules/*.json` over ad-hoc heuristics when deciding how to generate or repair specs.
- Use `coverage-policy.md` and `feature-completeness.md` before generating a new managed spec for coverage backfill.
- Use `classification-upgrade-rules.md` when a repaired spec starts to drift semantically.
- Do not auto-update snapshots unless there is evidence that the UI change is intended.
- Do not keep or repair specs that target pages outside `<webTestRoot>/`; delete them or rebuild the capability under `web_test` first.
