# Business Mode Spec Templates

AI 在为业务页面生成测试用例时，请参考以下模板。

## Visual Regression Spec Template

```typescript
import { test, expect } from '@tencent/kuikly-web-aitest';

test.describe('<BusinessDisplayName> visual regression', () => {
  test('page renders correctly', async ({ kuiklyPage }) => {
    await kuiklyPage.goto({ bundle: '<bundle_name>' });
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page).toHaveScreenshot('<bundle_name>-homepage.png');
  });

  test('page renders with specific page_name', async ({ kuiklyPage }) => {
    await kuiklyPage.goto({ bundle: '<bundle_name>', pageName: '<page_name>' });
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page).toHaveScreenshot('<page_name>.png');
  });
});
```

## Functional Spec Template

```typescript
import { test, expect } from '@tencent/kuikly-web-aitest';

test.describe('<BusinessDisplayName> functional tests', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto({ bundle: '<bundle_name>' });
    await kuiklyPage.waitForRenderComplete();
  });

  test('page has root container', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.locator('#root')).toBeVisible();
  });

  test('page renders main content', async ({ kuiklyPage }) => {
    // Wait for business-specific content to render
    // Adapt selector based on source code analysis
    const content = kuiklyPage.page.locator('[data-kuikly-component]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('interaction works correctly', async ({ kuiklyPage }) => {
    // Example: click a button and verify state change
    const button = kuiklyPage.page.locator('text=Submit');
    await button.click();
    // Verify expected outcome
  });
});
```

## Key Patterns

### goto() Usage in Business Mode

```typescript
// Navigate by bundle name (resolves via config urlPattern)
await kuiklyPage.goto({ bundle: 'gamecenter_jcc_weekly_report' });

// Navigate with page_name parameter
await kuiklyPage.goto({ bundle: 'qq_gift', pageName: 'qq_gift_detail' });

// Navigate with explicit path
await kuiklyPage.goto({ path: '/gamecenter_qq_gift/index.html' });

// Navigate without auto-waiting for render
await kuiklyPage.goto({ bundle: 'qq_gift', waitForRender: false });
```

### Wait Strategies

```typescript
// Default: network idle + 100ms stabilization
await kuiklyPage.waitForRenderComplete();

// Custom timeout
await kuiklyPage.waitForRenderComplete(60000);

// Wait for specific content to appear
await kuiklyPage.page.waitForSelector('.main-content', { timeout: 15000 });
```

### Screenshot Naming Convention

Business mode specs should name screenshots as:
- `<bundle_name>-<scenario>.png` for visual regression
- Place in `tests/<biz>/visual/` directory

### File Naming Convention

- Visual specs: `tests/<biz>/visual/<page-name>.visual.spec.ts`
- Functional specs: `tests/<biz>/functional/<page-name>.functional.spec.ts`

## Notes for AI Spec Generation

1. Read the business source code (@Page annotated classes) to understand page structure
2. Look for ViewModel classes to understand state management and data flow
3. Look for View/App composable functions to understand UI structure
4. Generate visual regression tests for the initial page state
5. Generate functional tests for interactive elements found in the source code
6. Business pages load two scripts: `business/nativevue2.js` (shared) + `<bundle>.js` (page-specific)
7. Most business pages use `#root` as the main mount point
8. Pages may require QQ SDK (mqq) which is not available in test environment — handle gracefully
