# Page Mapping Reference

Use this reference together with `scan-web-test-pages.mjs`. The script is the source of truth; this file describes how to interpret it.

## Page categories in the current repo

- `components`: static component carriers such as `KRViewTestPage`, `KRVideoViewTestPage`, `KRHoverViewTestPage`, `KRBlurViewTestPage`
- `styles`: visual style carriers such as `BorderTestPage`, `ShadowTestPage`, `TransformTestPage`
- `interactions`: user interaction carriers such as `ClickTestPage`, `GestureTestPage`, `EventCaptureTestPage`, `PageListTestPage`
- `animations`: animation carriers such as `CSSTransitionTestPage`, `JSFrameAnimTestPage`, `PropertyAnimTestPage`
- `composite`: integrated scenarios such as `SearchTestPage`, `FormTestPage`
- `modules`: module carriers such as `NotifyModuleTestPage`, `CalendarModuleTestPage`, `CodecModuleTestPage`

## Completeness expectations

- Every `web_test` page should have at least one spec that calls `kuiklyPage.goto('<PageName>')`.
- Every spec under `web-e2e/tests/` must target only pages registered under `demo/.../pages/web_test/`.
- If the required capability has no suitable `web_test` page yet, add a new carrier page under `web_test` first and only then add or migrate the spec.
- Specs targeting non-`web_test` pages are policy violations and must be deleted or retargeted after recreating the capability in `web_test`.
- A spec may target the same page as another spec when it adds branch or module coverage.
- Additional specs like `*-branches.spec.ts` are expected when they intentionally target branch coverage.
- A page without any spec is a genuine completeness gap.

## Naming conventions already present

- `static` specs use the `*-static.spec.ts` suffix for deterministic assertions, with component and style carriers grouped under `static/components/` and `static/styles/`.
- `functional` specs use the `*-functional.spec.ts` suffix for interaction-triggered DOM/state changes, with module carriers grouped under `functional/modules/`.
- `visual` specs use the `*-visual.spec.ts` suffix for screenshot-only conclusions, including visual regression companions under semantic subdirectories such as `visual/components/`, `visual/styles/`, and `visual/animations/`.
- Split scenarios may produce sibling `*-static.spec.ts`, `*-functional.spec.ts`, and `*-visual.spec.ts` files for the same page when one legacy spec covered multiple assertion intents.

## When to update classification-policy.mjs

- Most newly added handwritten specs do **not** require changes to `web-e2e/scripts/lib/classification-policy.mjs`; placing the file under the correct semantic directory is enough.
- Update `CATEGORY_TARGET_SEGMENTS` and `MANAGED_TARGET_CLASSIFICATION` when a managed `web_test` page category gains a new semantic target or changes its default placement.
- Update `HYBRID_TARGETS` when a new paired functional / visual scenario should be included in `--level hybrid` runs.
- Update `TARGET_LEVEL_TARGETS` only when CLI `--level` routing itself changes.
- Use `classification-upgrade-rules.md` to decide when a generated or repaired spec should be warned as a candidate for static -> functional, static -> visual, or functional -> hybrid promotion.

## Interpreting scan results

- `missingSpecs`: page exists under `web_test`, but no spec targets it.
- `orphanSpecTargets`: spec calls `kuiklyPage.goto()` for a page that is not present anywhere and must be fixed manually.
- `nonWebTestSpecTargets`: spec points at a page that exists outside `web_test`; this is a hard policy violation and the spec must be deleted or migrated after adding the needed `web_test` page.
- `specsWithoutGoto`: spec does not use the standard page navigation helper and may need manual review.
- `multiMappedPages`: page is targeted by multiple specs. This is often valid for branch coverage and should not be treated as a bug by itself.
- `summary.strictPagePolicyPassed`: all specs target `web_test` pages and use standard navigation.
