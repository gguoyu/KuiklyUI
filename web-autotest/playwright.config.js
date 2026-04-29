const { defineConfig, devices } = require('@playwright/test');
const { runtime, reporting } = require('./config/index.cjs');

/**
 * Playwright configuration for Kuikly Web E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
const port = runtime.resolvePort();
// Make the resolved port available to all spec files via process.env
// so specs can construct expected URLs without importing CJS modules directly.
process.env.KUIKLY_PORT = String(port);
const skipWebServer = process.env.KUIKLY_SKIP_WEBSERVER === 'true';
const resolvedWorkers = runtime.resolvePlaywrightWorkers();
const resolvedRetries = runtime.resolvePlaywrightRetries();

module.exports = defineConfig({
  testDir: './tests',
  timeout: runtime.playwrightTimeoutMs,
  retries: resolvedRetries,
  workers: resolvedWorkers,
  reporter: [
    ['html', { outputFolder: reporting.htmlOutputFolder }],
    ['list'],
    ['json', { outputFile: reporting.jsonOutputFile }],
  ],
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 375, height: 812 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        launchOptions: {
          args: [
            '--font-render-hinting=none',
            '--disable-font-subpixel-positioning',
            '--force-device-scale-factor=1',
          ],
        },
      },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: 'node scripts/serve.cjs',
        port,
        reuseExistingServer: true,
        timeout: runtime.webServerTimeoutMs,
      },
});
