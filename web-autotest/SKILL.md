---
name: kuikly-web-autotest
description: Run and maintain the KuiklyUI web automated test closed loop. Use when Codex needs to execute web-e2e end-to-end tests, collect and check Kotlin coverage, inspect failing cases, detect missing web_test page coverage, identify low-coverage Kotlin files, decide whether a failure is a test issue or a product issue, and drive the repo through the kuikly-web-autotest skill workflow with minimal manual intervention.
---

# Kuikly Web Autotest

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
- `web-autotest/references/feature-completeness.md`
- `web-autotest/references/failure-policy.md`
- `web-autotest/references/interaction-protocol.md`
- `web-autotest/references/classification-upgrade-rules.md`
- `web-autotest/references/anti-patterns-catalog.md`
- `web-autotest/references/spec-templates.md`
- `web-autotest/references/page-generation-guide.md`

Accumulated experience (read before writing carrier pages or specs):
- `web-autotest/experience/carrier-page-pitfalls.md` — Kotlin DSL 坑、shared observable、动态模板字符串、styles category 交互覆盖等
- `web-autotest/experience/playwright-kuikly-limits.md` — headless 下不可触发的事件、Modal/click 限制、KRListView 滚动、screenshot 更新等

**When you encounter a new problem worth recording:**
1. Check if it belongs in `carrier-page-pitfalls.md` (Kotlin page authoring) or `playwright-kuikly-limits.md` (runtime/headless behavior).
2. Add a new numbered section with: problem description, root cause, concrete fix or workaround, and a rule to follow next time.
3. If it fits neither file, create a new `experience/<topic>.md`.

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
- Primary machine-readable output: `web-autotest/reports/autotest/loop-report.json`
- User-facing quick reference: `web-autotest/docs/QUICKSTART.md`

## Build vs skip-build — decide first

**Before running any loop command, answer: have any `.kt` files under `web_test/` been added or changed since the last successful build?**

| Situation | Command |
|-----------|---------|
| First run, or any new/modified Kotlin carrier page since last build | `node web-autotest/scripts/loop/run-autotest-loop.mjs --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan` |
| Only spec (`.ts`) or rules (`.json`) changes, build artifacts are current | `node web-autotest/scripts/loop/run-autotest-loop.mjs --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan` |

**Default focused rerun (spec iteration only):**
```bash
node web-autotest/scripts/kuikly-test.mjs --skip-build --test <spec>
```

Why this matters: `--skip-build` reuses the last compiled JS bundle. A new Kotlin carrier page that has not been compiled will not be loadable by Playwright — the loop will generate a spec for it, the focused verification will immediately fail ("page not found"), and the spec will be rolled back. Always build first when Kotlin files change.

When coverage is still below threshold, continue the closed loop automatically as long as the next move stays inside the safe mutation scope below.

## Batch coverage improvement workflow

**Rule: Do NOT run full validation after every small change. Batch all improvements first, then validate once.**

When coverage is below threshold and improvements are needed:

1. **Read the coverage targets first** — run `suggest-test-targets.mjs` once to see the full ranked list of low-coverage files.
2. **Plan the full batch** — for every reachable file in the list, decide upfront: extend existing carrier page, add new spec, or skip (known headless limit).
3. **Write all Kotlin carrier page changes** — extend multiple `.kt` files before touching any spec. Read the source file to understand what props/events to expose.
4. **Write all spec changes** — after all Kotlin changes are done, write the corresponding specs.
5. **Validate once** — only after all batch changes are complete, run the full build + loop.
6. **Repeat if needed** — if coverage is still short, do another batch round. Do not run validation between individual file changes.

Do NOT:
- Run `kuikly-test.mjs` or `run-autotest-loop.mjs` after editing a single page or spec.
- Write one spec, run tests, write the next spec, run tests. This wastes time and tokens.

Do:
- Write all carrier page extensions (5–10 files) in one pass.
- Write all spec extensions in one pass.
- Then run one build + loop to validate everything at once.

When coverage cannot be pushed further by extending or repairing existing specs, inspect `suggest-test-targets.mjs` and the low-coverage files to decide whether the blocker is one of these two cases:

- there is already a usable `web_test` page carrier, but the current spec set does not cover enough reachable behavior
- there is no reasonable `web_test` page carrier for the uncovered behavior

If the second case is confirmed, create a minimal carrier page — see **Carrier page generation** below.

## Workflow

1. Use the loop entrypoint as the primary command.

```bash
node web-autotest/scripts/loop/run-autotest-loop.mjs
```

Default behavior:
- runs page/spec completeness scan first (including `sourceFilesWithoutPage` detection)
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
- never keep, repair, or generate specs that target pages outside `<webTestRoot>/`
- when a legacy spec points at a non-`web_test` page, delete or migrate that spec only after recreating the capability under `web_test`
- **generate carrier pages for source files that have no `web_test` page yet** — see below
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
- Use `feature-completeness.md` and `classification-upgrade-rules.md` together when deciding whether a generated spec is worth keeping.
- Do not use runtime artifacts, build artifacts, obfuscated export names, internal method names, or temporary injected objects as assertions or generated-oracle inputs.

2. Scan page and spec completeness directly when you need detailed raw data.

```bash
node web-autotest/scripts/loop/scan-web-test-pages.mjs
```

Use the result to detect:
- `missingSpecs`: pages under `web_test` without any spec
- `orphanSpecTargets`: specs targeting pages that do not exist anywhere
- `nonWebTestSpecTargets`: specs targeting pages outside `web_test`
- `specsWithoutGoto`: specs not using standard page navigation
- `sourceFilesWithoutPage`: source files under `sourceRoots` that have no matching `web_test` carrier page yet — these are candidates for AI-driven carrier page generation

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

## Carrier page generation

All source files under `sourceRoots` are render-layer implementations (e.g. `KRView.kt`,
`KRImageView.kt`, `KRNotifyModule.kt`). They have no state-driven text of their own, so the
loop cannot auto-generate carrier pages — it emits a `carrier-page-needed` signal instead
and the AI must write the page from scratch.

### When the loop emits `carrier-page-needed`

The warning contains:
```json
{
  "type": "carrier-page-needed",
  "file": "core-render-web/.../KRImageView.kt",
  "fileName": "KRImageView",
  "suggestedPageName": "KRImageViewTestPage",
  "suggestedCategory": "components",
  "targetPath": "demo/src/.../web_test/components/KRImageViewTestPage.kt",
  "action": "AI_GENERATE_CARRIER_PAGE"
}
```

### How to generate the carrier page (AI task)

1. **Read the source file** at `warning.file` to understand what it exposes (props, events, behaviors).
2. **Verify Kotlin DSL API names before writing the carrier page.** The DSL method names exposed to page authors (e.g. `editable()`, `placeholder()`, `maxTextLength()`) are defined in the view's `Attr` class under `core/src/commonMain/kotlin/com/tencent/kuikly/core/views/`. Always grep for the exact method name before using it — do not guess. Example:
   ```bash
   grep -n "fun editable\|fun placeholder\|fun maxText" core/src/commonMain/kotlin/com/tencent/kuikly/core/views/InputView.kt
   ```
   A compile error (`Unresolved reference`) means the method name is wrong. Fix it before running the build.
3. **Read `web-autotest/references/page-generation-guide.md`** for the Kotlin DSL patterns appropriate for `warning.suggestedCategory`.
4. **Generate the Kotlin carrier page** following the state-driven text pattern — every testable behavior must have a stable text oracle (a label whose text changes with state). Do not generate placeholder pages.
5. **Write the file** to `warning.targetPath`.
6. **Run the generator script** to update `interaction-protocol.json` with the new page's `actionScripts`:
   ```bash
   node web-autotest/scripts/loop/generate-carrier-page.mjs <source-file> --write
   ```
   The `--write` flag updates `interaction-protocol.json` **and** writes a scaffold Kotlin file only if the target path does not already exist. If you already wrote the Kotlin file manually (recommended), the script will skip the Kotlin write and only update the JSON — this is the correct behavior. Do not delete your handwritten Kotlin file before running this command.
7. **Run a full build** — new Kotlin carrier pages must be compiled into the JS bundle before they can be loaded by Playwright. Never use `--skip-build` after adding a new carrier page:
   ```bash
   node web-autotest/scripts/loop/run-autotest-loop.mjs --max-rounds 1
   ```
   If you use `--skip-build` when a new carrier page exists but has not yet been built, the loop will generate a spec for the page, the focused verification will fail (page not found), and the spec will be rolled back.

**`--skip-build` is only safe when:**
- No new Kotlin carrier pages have been added since the last successful build.
- You are only modifying TypeScript spec files or rules JSON.

**Always use a full build (no `--skip-build`) when:**
- A new Kotlin carrier page (`.kt` file) was written to `web_test/`.
- A Kotlin carrier page was modified to change its UI text or behavior.

### When to stop instead of generating

Stop and emit a manual-review warning when:
- the source file implements internal infrastructure (scheduler, serializer, DOM utils) with no user-facing UI behavior
- the intended behavior requires external SDK or network access that cannot be simulated in a deterministic `web_test` page
- nearby `web_test` patterns do not provide enough signal to infer what the page should test

## Known headless rendering limits

Some Kotlin source paths are permanently unreachable under Playwright headless Chromium. Do not spend loop rounds trying to cover them — escalate immediately instead.

| Pattern | Root cause | Action |
|---------|-----------|--------|
| `KRTextFieldView.kt` / `KRTextAreaView.kt` event handlers (`textDidChange`, `focus`, `blur`) | Kuikly's Input component fires its `input` DOM event only on real user typing; Playwright `fill()` and `type()` do not trigger it in headless mode | Accept current coverage; skip |
| `KRView.kt` / `KuiklyRenderCSSKTX.kt` branch paths that require dynamic style re-application | Some CSS branches require a re-render cycle that does not happen in headless timing | Accept current coverage; skip |
| Any `KRView` that uses `if/Modal` DSL for overlay rendering | Kuikly's `Modal` component does not render in headless Chromium | Mark spec as `test.skip` with `[KNOWN: Modal headless rendering issue]` |
| Any submit / confirm `KRView` button whose click event does not fire in a specific page context | Kuikly click dispatch depends on view hierarchy; some deeply-nested views do not receive synthetic clicks | Verify with `page.evaluate`; if confirmed, mark as `test.skip` with `[KNOWN: KRView click headless issue]` |

When a coverage gap falls into one of the above patterns and the loop has already attempted at least 2 rounds without improvement, stop and escalate rather than continuing.

## Decision rules

- If a failure is caused by stale assertions, stale locators, or missing waits, fix the test.
- If a screenshot diff matches intentional UI changes in modified source files, update snapshots.
- If a failure indicates unexpected product behavior with no supporting code change, treat it as a code warning and do not silently weaken the test.
- If a failure category is `PAGE_CRASH`: this is always a product-layer issue. Mark the crashing test as `test.skip` with comment `[KNOWN: PAGE_CRASH on <PageName>]` and emit a manual-review warning. Do not delete or rewrite the test logic — just skip it so the suite can continue.
- If coverage is below threshold, add or extend tests based on the low-coverage source object, following `coverage-policy.md` for target ordering and `feature-completeness.md` for minimum behavior closure, then rerun the full flow.
- If a handwritten spec already exists for a page and that file is a page-level blocker with only skipped or pending tests, do not auto-generate a parallel managed spec for the same page.
- If a spec targets a page outside `<webTestRoot>/`, delete or migrate that spec before continuing; do not grandfather legacy non-`web_test` targets.
- If a target capability is not represented in `web_test` but the intended behavior is already obvious from the source file and existing patterns, generate the carrier page (see **Carrier page generation** above) before adding the spec.
- If a target capability is not represented in `web_test` and the intended behavior is still ambiguous after reading the source file, stop and report it as a carrier-page blocker.
- If a new carrier page would only be a placeholder title page and would not express the missing capability itself, stop and report it as a carrier-page blocker instead of creating it.

## Escalate only when

- the page behavior is ambiguous and cannot be classified as expected change vs regression
- the source object with low coverage has no reasonable `web_test` carrier page yet and the intended behavior remains unclear after reading the source file
- the pipeline itself is broken and not attributable to test code
- after reasonable retries, the same failure still points to product behavior rather than test behavior
- coverage has not improved after 2+ loop rounds on the same target, and the uncovered paths fall under a **Known headless rendering limit** (see section above) — accept the gap, record it as a known limitation, and stop

## Output expectations

When you finish a run, report:
- page/spec completeness status
- `sourceFilesWithoutPage` count and which ones were handled (generated or blocked)
- initial failures and what was auto-fixed
- remaining warnings that look like product issues
- final coverage numbers and whether thresholds passed
- which files were changed
