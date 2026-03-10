import { test, expect, Page } from '@playwright/test';
import { getTestablePages, type PageEntry } from './page-list';

const testablePages = getTestablePages();

/**
 * 等待 Kuikly 页面渲染完成
 * 根据页面特性选择不同的等待策略
 */
async function waitForPageReady(page: Page, entry: PageEntry) {
  // 等待 root 容器下有子元素（Kuikly 渲染完成的标志）
  try {
    await page.waitForSelector('#root > *', { timeout: 500 });
  } catch {
    // 某些页面可能使用不同的渲染方式，继续执行
  }

  // 等待网络请求空闲（图片等资源加载完成）
  try {
    await page.waitForLoadState('networkidle', { timeout: 2_000 });
  } catch {
    // 超时不阻塞，继续截图
  }

  // 额外等待时间（动画/异步渲染）
  const waitTime = entry.waitTime ?? 2000;
  await page.waitForTimeout(waitTime);
}

// 为每个可测试页面生成一个测试用例
for (const entry of testablePages) {
  test(`[${entry.category}] ${entry.name}`, async ({ page }) => {
    // 1. 导航到页面
    await page.goto(`/?is_playwright_test=1&page_name=${entry.name}`, {
      waitUntil: 'domcontentloaded',
    });

    // 2. 等待渲染完成
    await waitForPageReady(page, entry);

    // 3. 执行截图对比（截图路径和 maxDiffPixelRatio 由 playwright.config.ts 统一配置）
    await expect(page).toHaveScreenshot(`${entry.name}.png`, {
      fullPage: true,
    });
  });
}
