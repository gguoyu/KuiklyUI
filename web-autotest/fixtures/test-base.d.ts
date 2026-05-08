import { KuiklyPage } from './kuikly-page';
/**
 * Extended test object with KuiklyPage fixture.
 *
 * When KUIKLY_COLLECT_V8_COVERAGE=true, V8 coverage is started before each test
 * and persisted to .v8_output/ during teardown.
 */
export declare const test: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & {
    kuiklyPage: KuiklyPage;
}, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export { expect } from '@playwright/test';
