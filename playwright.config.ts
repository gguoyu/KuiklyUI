import { defineConfig, devices } from '@playwright/test';

/**
 * KuiklyUI Web Render - 视觉回归测试配置，注意，跑测试用例前，一定要先将 web 的 devServer 运行起来
 *
 * 使用方式:
 *   首次运行（生成基准截图）: npx playwright test --update-snapshots
 *   后续回归测试:            npx playwright test
 *   查看报告:                npx playwright show-report
 *   只测试某个分类:          npx playwright test --grep "compose"
 *   只测试某个页面:          npx playwright test --grep "TextDemo"
 */
export default defineConfig({
  testDir: './web-tests',
  /* 单个测试的超时时间 */
  timeout: 30_000,
  /* 整个测试套件超时 */
  globalTimeout: 600_000,

  /* 测试失败后重试次数 */
  retries: 1,
  /* 并行 worker 数量 */
  workers: 4,

  /* 截图对比配置 */
  expect: {
    toHaveScreenshot: {
      /* 允许 2% 的像素差异（防止抗锯齿等导致误报） */
      maxDiffPixelRatio: 0.02,
      /* 基准截图存放路径模板 */
      pathTemplate:
        '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
    },
  },

  /* 测试报告 */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* 所有项目共享配置 */
  use: {
    /* 基础 URL */
    baseURL: 'http://127.0.0.1:8080',
    /* 截图设置 */
    screenshot: 'only-on-failure',
    /* 录制视频（仅在失败时保留） */
    video: 'retain-on-failure',
    /* 追踪（仅在首次重试时开启） */
    trace: 'on-first-retry',
  },

  /* 测试项目（桌面版/分辨率） */
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],

  /*
   * 开发服务器配置
   * 如果你已手动启动 h5App 服务，可设置 reuseExistingServer: true
   * 否则 Playwright 会自动执行 command 来启动服务器
   */
  webServer: {
    command: 'npx playwright test --list',  // placeholder, 见下方说明
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
