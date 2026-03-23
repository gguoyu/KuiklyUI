import { test as base } from '@playwright/test';
import { KuiklyPage } from './kuikly-page';
import { collectCoverage } from './coverage';

/**
 * Extended test object with KuiklyPage fixture
 * All test cases should import and use this test object
 *
 * Coverage collection is automatic:
 * - When using instrumented server (npm run serve:instrumented),
 *   window.__coverage__ is read after each test and written to .nyc_output/
 * - When using normal server, collectCoverage() silently skips (no __coverage__ on window)
 */
export const test = base.extend<{ kuiklyPage: KuiklyPage }>({
  kuiklyPage: async ({ page }, use, testInfo) => {
    // Create KuiklyPage instance
    const kuiklyPage = new KuiklyPage(page);

    // Provide to test
    await use(kuiklyPage);

    // Auto-collect coverage after each test (no-op when not using instrumented server)
    await collectCoverage(page, testInfo.title);
  },
});

export { expect } from '@playwright/test';
