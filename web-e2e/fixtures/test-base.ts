import { test as base } from '@playwright/test';
import { KuiklyPage } from './kuikly-page';

/**
 * Extended test object with KuiklyPage fixture
 * All test cases should import and use this test object
 */
export const test = base.extend<{ kuiklyPage: KuiklyPage }>({
  kuiklyPage: async ({ page }, use) => {
    // Create KuiklyPage instance
    const kuiklyPage = new KuiklyPage(page);
    
    // Provide to test
    await use(kuiklyPage);
    
    // Cleanup if needed
  },
});

export { expect } from '@playwright/test';
