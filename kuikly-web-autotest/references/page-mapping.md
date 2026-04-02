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
- A spec may target the same page as another spec when it adds branch or module coverage.
- Additional specs like `*-branches.spec.ts` are expected when they intentionally target branch coverage.
- A page without any spec is a genuine completeness gap.

## Naming conventions already present

- `L0` component specs are mostly `kr*.spec.ts`.
- `L0` style specs use style names like `border.spec.ts`.
- `L1-simple` specs include `click.spec.ts`, `input.spec.ts`, `modal.spec.ts`, and module-specific specs under `L1-simple/modules/`.
- `L2-complex` specs include scenario specs plus branch-focused specs like `event-capture-branches.spec.ts` and `paging-list-branches.spec.ts`.

## Interpreting scan results

- `missingSpecs`: page exists under `web_test`, but no spec targets it.
- `orphanSpecTargets`: spec calls `kuiklyPage.goto()` for a page that is not present under `web_test`.
- `specsWithoutGoto`: spec does not use the standard page navigation helper and may need manual review.
- `multiMappedPages`: page is targeted by multiple specs. This is often valid for branch coverage and should not be treated as a bug by itself.
