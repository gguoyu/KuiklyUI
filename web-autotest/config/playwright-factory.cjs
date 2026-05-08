'use strict';

/**
 * Playwright 配置工厂函数
 *
 * 消费方用法（由 npx kuikly-aitest init 生成到 web-autotest/playwright.config.js）：
 *   const { createPlaywrightConfig } = require('@tencent/kuikly-web-aitest/config/playwright-factory');
 *   module.exports = createPlaywrightConfig({ testDir: './tests' });
 *
 * KuiklyUI 自身仍使用 web-autotest/playwright.config.js（不走这个工厂）。
 */

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// __dirname = config/，上溯一级得到包根目录
const packageRoot = path.join(__dirname, '..');

/**
 * @param {object} [overrides]  覆盖默认 Playwright 配置的字段（同 defineConfig 参数）
 * @returns {import('@playwright/test').Config}
 */
function createPlaywrightConfig(overrides = {}) {
  const { runtime, reporting } = require('./index.cjs');
  const port = runtime.resolvePort();

  // 将解析后的端口号透传给所有 spec 文件，避免 spec 直接 require CJS 模块
  process.env.KUIKLY_PORT = String(port);

  const skipWebServer = process.env.KUIKLY_SKIP_WEBSERVER === 'true';
  const resolvedWorkers = runtime.resolvePlaywrightWorkers();
  const resolvedRetries = runtime.resolvePlaywrightRetries();

  // overrides 中的 webServer / projects 等字段可以完全替换默认值
  const { webServer: overrideWebServer, ...restOverrides } = overrides;

  return defineConfig({
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
    // webServer：使用包内绝对路径，确保 npm 模式下也能找到 serve.cjs
    webServer: overrideWebServer !== undefined
      ? overrideWebServer
      : skipWebServer
        ? undefined
        : {
            command: `node "${path.join(packageRoot, 'scripts', 'serve.cjs')}"`,
            port,
            reuseExistingServer: true,
            timeout: runtime.webServerTimeoutMs,
          },
    ...restOverrides,
  });
}

module.exports = { createPlaywrightConfig };
