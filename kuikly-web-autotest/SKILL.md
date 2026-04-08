---
name: kuikly-web-autotest
description: Run and maintain the KuiklyUI web automated test closed loop. Use when Codex needs to execute web-e2e end-to-end tests, collect and check NYC Kotlin coverage, inspect failing cases, detect missing web_test page coverage, identify low-coverage Kotlin files, decide whether a failure is a test issue or a product issue, and drive the repo toward the AUTOTEST.md workflow with minimal manual intervention.
---

# Kuikly Web Autotest

Use this skill from the repository root.

## Core rule

Treat `web-e2e/scripts/kuikly-test.mjs --full` as the canonical execution entrypoint for the current repo. Do not recreate the build, instrumentation, server, Playwright, and coverage pipeline manually unless you are debugging the pipeline itself.

## Fixed operating mode

This skill is the fixed project workflow for KuiklyUI web autotest.

- Default AI trigger: when the user asks to run or continue the web autotest closed loop, improve web coverage, or inspect web autotest results, use this skill directly.
- Default real run: `node kuikly-web-autotest/scripts/run-autotest-loop.mjs --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan`
- Default focused rerun: `node web-e2e/scripts/kuikly-test.mjs --skip-build --test <spec>`
- Primary machine-readable output: `web-e2e/reports/autotest/loop-report.json`
- User-facing quick reference: `web-e2e/AUTOTEST-USER-GUIDE.md`

When coverage is still below threshold, continue the closed loop automatically as long as the next move stays inside the safe mutation scope below.

When coverage cannot be pushed further by extending or repairing existing specs, inspect `suggest-test-targets.mjs` and the low-coverage files to decide whether the blocker is one of these two cases:

- there is already a usable `web_test` page carrier, but the current spec set does not cover enough reachable behavior
- there is no reasonable `web_test` page carrier for the uncovered behavior

If the second case is confirmed, create a minimal carrier page only when the expected behavior is already clear from nearby `web_test` patterns; otherwise stop the loop with a manual-review warning instead of inventing page behavior.

## Workflow

1. Use the loop entrypoint as the primary command.

```bash
node kuikly-web-autotest/scripts/run-autotest-loop.mjs
```

Default behavior:
- runs page/spec completeness scan first
- runs the canonical `web-e2e/scripts/kuikly-test.mjs --full` flow
- analyzes Playwright failures and coverage results
- auto-generates managed `auto-*.spec.ts` files for missing pages and low-coverage candidate pages
- auto-regenerates previously generated managed specs when those generated specs fail with stale locators or stale assertions
- retries one extra canonical pass when the first pass only indicates a coverage threshold failure
- writes a machine-readable loop report to `web-e2e/reports/autotest/loop-report.json`

Useful flags:
- `--dry-run`: only analyze existing reports without rerunning tests
- `--mutate-only`: apply auto-generated spec creation or refresh from existing reports without rerunning the full suite
- `--retries 2`: allow two extra loop attempts after the first canonical run
- `--max-rounds 3`: cap the total full-run rounds for the closed loop executor
- `--max-new-specs 5`: cap how many new managed specs can be added in one loop pass
- `--allow-incomplete-scan`: continue even when page/spec completeness has gaps
- `--skip-build`, `--update-snapshots`, `--headed`, `--debug`, `--level`, `--test`: forwarded to the canonical runner

Automatic mutation scope:
- create managed coverage specs for missing `web_test` pages
- create managed coverage specs for low-coverage source objects by following `suggest-test-targets.mjs`
- refresh managed generated specs after failures in those same generated specs
- repair handwritten specs when the fix is a deterministic page-target remap or legacy `page.goto('?page_name=...')` normalization to `kuiklyPage.goto('...')`
- add a minimal `web_test` page only when a completeness gap or coverage gap clearly maps to a concrete missing carrier page and the required page behavior is obvious from existing repo patterns
- do not generate a new managed coverage spec for a page that is already fully represented by a handwritten blocker spec with only skipped or pending tests; treat that page as a blocker and stop
- after a handwritten repair, immediately rerun the patched spec with `web-e2e/scripts/kuikly-test.mjs --skip-build --test <spec>` to verify the fix result
- if that targeted rerun still fails, automatically roll back the handwritten patch and emit a manual-review warning in the loop report
- execute multiple full rounds, re-reading failure analysis and coverage after each round, and keep applying safe managed-spec repairs until the round budget is exhausted or the suite converges
- do not rewrite handwritten non-managed specs outside those narrow safe rules unless a future deterministic repair rule is added

2. Scan page and spec completeness directly when you need detailed raw data.

```bash
node kuikly-web-autotest/scripts/scan-web-test-pages.mjs
```

Use the result to detect:
- missing specs for `demo/.../pages/web_test/**`
- specs targeting pages that do not exist in `web_test`
- specs without a `kuiklyPage.goto()` target

3. Run the canonical test and coverage flow directly only when you are debugging the pipeline.

```bash
node web-e2e/scripts/kuikly-test.mjs --full
```

If you only need a subset while iterating, use `--level`, `--test`, or `--skip-build`, but return to `--full` before closing the task.

4. Analyze Playwright execution results.

```bash
node kuikly-web-autotest/scripts/analyze-playwright-results.mjs
```

Use the output to classify failures into:
- `SCREENSHOT_DIFF`
- `ELEMENT_NOT_FOUND`
- `ASSERTION_FAILED`
- `PAGE_CRASH`
- `TIMEOUT`
- `UNKNOWN`

5. Summarize coverage and low-coverage files.

```bash
node kuikly-web-autotest/scripts/summarize-coverage.mjs
node kuikly-web-autotest/scripts/suggest-test-targets.mjs
```

Use the results to find:
- whether `lines/functions/statements >= 70` and `branches >= 55`
- which Kotlin files are furthest below target
- which `web_test` pages and existing specs are the best candidates to extend

6. Build a single report before deciding edits.

```bash
node kuikly-web-autotest/scripts/build-autotest-report.mjs
```

Prefer this report as the working summary for the closed loop.

## Decision rules

- If a failure is caused by stale assertions, stale locators, or missing waits, fix the test.
- If a screenshot diff matches intentional UI changes in modified source files, update snapshots.
- If a failure indicates unexpected product behavior with no supporting code change, treat it as a code warning and do not silently weaken the test.
- If coverage is below threshold, add or extend tests based on the low-coverage source object and rerun the full flow.
- If a handwritten spec already exists for a page and that file is a page-level blocker with only skipped or pending tests, do not auto-generate a parallel managed spec for the same page.
- If a target capability is not represented in `web_test` but the intended behavior is already obvious from existing patterns, add the missing page under `demo/.../pages/web_test/` before adding the spec.
- If a target capability is not represented in `web_test` and the intended behavior is still ambiguous, stop and report it as a carrier-page blocker.
- If a new carrier page would only be a placeholder title page and would not express the missing capability itself, stop and report it as a carrier-page blocker instead of creating it.

## Escalate only when

- the page behavior is ambiguous and cannot be classified as expected change vs regression
- the source object with low coverage has no reasonable `web_test` carrier page yet and domain behavior is unclear
- the pipeline itself is broken and not attributable to test code
- after reasonable retries, the same failure still points to product behavior rather than test behavior

## Output expectations

When you finish a run, report:
- page/spec completeness status
- initial failures and what was auto-fixed
- remaining warnings that look like product issues
- final coverage numbers and whether thresholds passed
- which files were changed

