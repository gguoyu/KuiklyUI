import { test, expect } from '@playwright/test';

/**
 * 单页面调试测试
 *
 * 使用方法:
 *   PAGE_NAME=TextDemo npx playwright test tests/single-page.spec.ts
 *
 * 或者直接修改下面的 PAGE_NAME 常量
 */
const PAGE_NAME = process.env.PAGE_NAME || 'HelloWorldPage';

test(`单页面视觉测试 - ${PAGE_NAME}`, async ({ page }) => {
  await page.goto(`/?page_name=${PAGE_NAME}`, {
    waitUntil: 'domcontentloaded',
  });

  // 等待 Kuikly 渲染
  try {
    await page.waitForSelector('#root > *', { timeout: 15_000 });
  } catch {
    // continue
  }

  try {
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
  } catch {
    // continue
  }

  await page.waitForTimeout(2000);

  // 截图对比
  await expect(page).toHaveScreenshot(`${PAGE_NAME}.png`, {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});

test(`单页面交互测试 - ${PAGE_NAME} (滚动后)`, async ({ page }) => {
  await page.goto(`/?page_name=${PAGE_NAME}`, {
    waitUntil: 'domcontentloaded',
  });

  try {
    await page.waitForSelector('#root > *', { timeout: 15_000 });
  } catch {
    // continue
  }

  await page.waitForTimeout(2000);

  // 滚动页面
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1000);

  // 滚动后截图
  await expect(page).toHaveScreenshot(`${PAGE_NAME}-scrolled.png`, {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
