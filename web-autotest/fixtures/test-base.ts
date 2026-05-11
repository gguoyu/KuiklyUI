import { test as base } from '@playwright/test';
import { KuiklyPage } from './kuikly-page';
import { startV8Coverage, stopV8Coverage } from './coverage';

/**
 * Extended test object with KuiklyPage fixture.
 *
 * When KUIKLY_COLLECT_V8_COVERAGE=true, V8 coverage is started before each test
 * and persisted to .v8_output/ during teardown.
 */
export const test = base.extend<{ kuiklyPage: KuiklyPage }>({
  kuiklyPage: async ({ page }, use, testInfo) => {
    const coverageSession = await startV8Coverage(page);
    const businessURLPatterns = process.env.KUIKLY_BUSINESS_URL_PATTERNS
      ? JSON.parse(process.env.KUIKLY_BUSINESS_URL_PATTERNS)
      : undefined;
    const kuiklyPage = new KuiklyPage(page, { businessURLPatterns });

    await use(kuiklyPage);

    await stopV8Coverage(coverageSession, testInfo.title);
  },
});

export { expect } from '@playwright/test';
