'use strict';

/**
 * Playwright 配置工厂函数
 *
 * 消费方用法（由 npx @tencent/kuikly-web-aitest init 生成到 web-autotest/playwright.config.js）：
 *   const { createPlaywrightConfig } = require('@tencent/kuikly-web-aitest/config/playwright-factory');
 *   module.exports = createPlaywrightConfig({ testDir: './tests' });
 *
 * KuiklyUI 自身仍使用 web-autotest/playwright.config.js（不走这个工厂）。
 */

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// __dirname = config/，上溯一级得到包根目录
const packageRoot = path.join(__dirname, '..');
const { loadAutotestConfig, isBusinessMode } = require('./load-autotest-config.cjs');

/**
 * @param {object} [overrides]  覆盖默认 Playwright 配置的字段（同 defineConfig 参数）
 * @returns {import('@playwright/test').Config}
 */
function createPlaywrightConfig(overrides = {}) {
  const { runtime, reporting } = require('./index.cjs');

  // Load consumer config for business mode detection
  let autotestConfig;
  try { autotestConfig = loadAutotestConfig(); } catch (e) { autotestConfig = {}; }
  const businessMode = isBusinessMode(autotestConfig);

  const port = businessMode && autotestConfig.server && autotestConfig.server.port
    ? autotestConfig.server.port
    : runtime.resolvePort();
  process.env.KUIKLY_PORT = String(port);

  const baseURL = businessMode && autotestConfig.server && autotestConfig.server.baseURL
    ? autotestConfig.server.baseURL
    : `http://localhost:${port}`;

  // Inject business URL patterns for KuiklyPage fixture (via env → worker processes)
  if (businessMode && Array.isArray(autotestConfig.businesses)) {
    const patterns = {};
    autotestConfig.businesses.forEach(function (b) {
      if (b.name && b.urlPattern) patterns[b.name] = b.urlPattern;
    });
    process.env.KUIKLY_BUSINESS_URL_PATTERNS = JSON.stringify(patterns);
  }

  const skipWebServer = businessMode
    ? (autotestConfig.server ? autotestConfig.server.skipBuiltinServer !== false : true)
    : process.env.KUIKLY_SKIP_WEBSERVER === 'true';
  const resolvedWorkers = runtime.resolvePlaywrightWorkers();
  const resolvedRetries = runtime.resolvePlaywrightRetries();

  // overrides 中的 webServer / projects 等字段可以完全替换默认值
  const { webServer: overrideWebServer, ...restOverrides } = overrides;

  // Consumer-provided webServer (business mode)
  const consumerWebServer = (businessMode && !skipWebServer && autotestConfig.server && autotestConfig.server.startCommand)
    ? {
        command: autotestConfig.server.startCommand,
        port: port,
        reuseExistingServer: true,
        timeout: runtime.webServerTimeoutMs,
      }
    : undefined;

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
      baseURL: baseURL,
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
      : consumerWebServer !== undefined
        ? consumerWebServer
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
