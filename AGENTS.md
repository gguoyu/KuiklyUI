# Kuikly Web Autotest

This file is the single source of truth for the KuiklyUI web automated test skill.
It is read by all AI agents (Codex CLI, Windsurf, Cursor, etc.) and by Claude Code via
`.claude/commands/kuikly-web-autotest.md`.

Use this skill from the repository root.

## Core rule

Treat `web-autotest/scripts/kuikly-test.mjs --full` as the canonical execution entrypoint for the current repo. Do not recreate the build, test server, Playwright, and V8 coverage pipeline manually unless you are debugging the pipeline itself.

## Apply Patch Constraints

- Atomic edits only: never use `apply_patch` to replace more than 50 lines at once or to modify multiple logically independent code blocks in one patch.
- Precise targeting: every patch must match the exact affected lines; if multiple locations must change, split them into separate `apply_patch` operations.
- Preserve context: include at least 3 lines of original surrounding context around the affected block so the patch target stays unique.
- No whole-file overwrite: unless creating a new file, never use `apply_patch` to rewrite an entire file in one shot.

## Fixed operating mode

This skill is the fixed project workflow for KuiklyUI web autotest.

## Rule sources of truth

When extending tests or backfilling coverage, use the skill-owned references and rules below as the source of truth.

Human-readable references:
- `web-autotest/references/workflow.md`
- `web-autotest/references/page-mapping.md`
- `web-autotest/references/coverage-policy.md`
- `web-autotest/references/backfill-priority.md`
- `web-autotest/references/feature-completeness.md`
- `web-autotest/references/testability-hard-rules.md`
- `web-autotest/references/failure-policy.md`
- `web-autotest/references/repair-ladder.md`
- `web-autotest/references/test-page-design.md`
- `web-autotest/references/interaction-protocol.md`
- `web-autotest/references/animation-strategy.md`
- `web-autotest/references/review-checklist.md`
- `web-autotest/references/classification-upgrade-rules.md`
- `web-autotest/references/anti-patterns-catalog.md`

Machine-readable rules consumed by the loop:
- `web-autotest/rules/template-profiles.json`
- `web-autotest/rules/interaction-protocol.json`
- `web-autotest/rules/animation-strategy.json`
- `web-autotest/rules/review-checklist.json`
- `web-autotest/rules/priority-matrix.json`
- `web-autotest/rules/testability-rules.json`
- `web-autotest/rules/repair-ladder.json`
- `web-autotest/rules/anti-examples.json`

- Default AI trigger: when the user asks to run or continue the web autotest closed loop, improve web coverage, or inspect web autotest results, use this skill directly.
- Default real run: `node web-autotest/scripts/loop/run-autotest-loop.mjs --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan`
- Default focused rerun: `node web-autotest/scripts/kuikly-test.mjs --skip-build --test <spec>`
- Primary machine-readable output: `web-autotest/reports/autotest/loop-report.json`
- User-facing quick reference: `web-autotest/docs/QUICKSTART.md`

When coverage is still below threshold, continue the closed loop automatically as long as the next move stays inside the safe mutation scope below.

When coverage cannot be pushed further by extending or repairing existing specs, inspect `suggest-test-targets.mjs` and the low-coverage files to decide whether the blocker is one of these two cases:

- there is already a usable `web_test` page carrier, but the current spec set does not cover enough reachable behavior
- there is no reasonable `web_test` page carrier for the uncovered behavior

If the second case is confirmed, create a minimal carrier page only when the expected behavior is already clear from nearby `web_test` patterns; otherwise stop the loop with a manual-review warning instead of inventing page behavior.

## Workflow

1. Use the loop entrypoint as the primary command.

```bash
node web-autotest/scripts/loop/run-autotest-loop.mjs
```

Default behavior:
- runs page/spec completeness scan first
- runs the canonical `web-autotest/scripts/kuikly-test.mjs --full` flow
- analyzes Playwright failures and coverage results
- auto-generates managed `auto-*.spec.ts` files for missing pages and low-coverage candidate pages
- auto-regenerates previously generated managed specs when those generated specs fail with stale locators or stale assertions
- retries one extra canonical pass when the first pass only indicates a coverage threshold failure
- writes a machine-readable loop report to `web-autotest/reports/autotest/loop-report.json`

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
- immediately run targeted verification for newly created or refreshed managed specs, and roll them back if the focused rerun still fails
- never keep, repair, or generate specs that target pages outside `demo/.../pages/web_test/`
- when a legacy spec points at a non-`web_test` page, delete or migrate that spec only after recreating the capability under `web_test`
- add a minimal `web_test` page only when a completeness gap or coverage gap clearly maps to a concrete missing carrier page and the required page behavior is obvious from existing repo patterns
- do not generate a new managed coverage spec for a page that is already fully represented by a handwritten blocker spec with only skipped or pending tests; treat that page as a blocker and stop
- after a handwritten migration or repair, immediately rerun the affected spec with `web-autotest/scripts/kuikly-test.mjs --skip-build --test <spec>` to verify the result
- if that targeted rerun still fails, automatically roll back the handwritten patch and emit a manual-review warning in the loop report
- execute multiple full rounds, re-reading failure analysis and coverage after each round, and keep applying safe managed-spec repairs until the round budget is exhausted or the suite converges
- do not rewrite handwritten non-managed specs outside those narrow safe rules unless a future deterministic repair rule is added

### Semantic spec guardrails

- Keep new or repaired specs aligned with semantic assertion intent: `tests/static` for deterministic non-screenshot assertions, `tests/functional` for interaction-driven node / attribute / state changes, and `tests/visual` for screenshot-judged visual outcomes.
- Treat `hybrid` as paired functional + visual coverage for the same scenario; do not collapse ordinary single-intent specs into `hybrid`.
- Most newly added handwritten specs do **not** require changes to `web-autotest/scripts/lib/classification-policy.mjs`; placing the file under the correct semantic directory is enough.
- Update `web-autotest/scripts/lib/classification-policy.mjs` only when CLI `--level static|functional|visual|hybrid` routing changes, when managed page-category routing changes (`CATEGORY_TARGET_SEGMENTS` / `MANAGED_TARGET_CLASSIFICATION`), or when a new paired scenario must be added to `HYBRID_TARGETS`.
- Use stable, repeatable observable results as test oracles, such as text, DOM nodes, `data-kuikly-component`, stable attributes, bounding boxes, and screenshots.
- Use `backfill-priority.md`, `feature-completeness.md`, `testability-hard-rules.md`, and `classification-upgrade-rules.md` together when deciding whether a generated spec is worth keeping.
- Do not use runtime artifacts, build artifacts, obfuscated export names, internal method names, or temporary injected objects as assertions or generated-oracle inputs.

2. Scan page and spec completeness directly when you need detailed raw data.

```bash
node web-autotest/scripts/loop/scan-web-test-pages.mjs
```

Use the result to detect:
- missing specs for `demo/.../pages/web_test/**`
- specs targeting pages that do not exist anywhere
- specs targeting pages that exist outside `web_test` (`nonWebTestSpecTargets`)
- specs without a `kuiklyPage.goto()` target

3. Run the canonical test and coverage flow directly only when you are debugging the pipeline.

```bash
node web-autotest/scripts/kuikly-test.mjs --full
```

If you only need a subset while iterating, use `--level`, `--test`, or `--skip-build`, but return to `--full` before closing the task.

4. Analyze Playwright execution results.

```bash
node web-autotest/scripts/loop/analyze-playwright-results.mjs
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
node web-autotest/scripts/loop/summarize-coverage.mjs
node web-autotest/scripts/loop/suggest-test-targets.mjs
```

Use the results to find:
- whether `lines/functions/statements >= 70` and `branches >= 55`
- which Kotlin files are furthest below target
- which `web_test` pages and existing specs are the best candidates to extend

6. Build a single report before deciding edits.

```bash
node web-autotest/scripts/loop/build-autotest-report.mjs
```

Prefer this report as the working summary for the closed loop.

## Decision rules

- If a failure is caused by stale assertions, stale locators, or missing waits, fix the test.
- If a screenshot diff matches intentional UI changes in modified source files, update snapshots.
- If a failure indicates unexpected product behavior with no supporting code change, treat it as a code warning and do not silently weaken the test.
- If coverage is below threshold, add or extend tests based on the low-coverage source object, following `backfill-priority.md` for target ordering and `feature-completeness.md` for minimum behavior closure, then rerun the full flow.
- If a handwritten spec already exists for a page and that file is a page-level blocker with only skipped or pending tests, do not auto-generate a parallel managed spec for the same page.
- If a spec targets a page outside `demo/.../pages/web_test/`, delete or migrate that spec before continuing; do not grandfather legacy non-`web_test` targets.
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
