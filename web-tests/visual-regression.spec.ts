import { test, expect, Page } from '@playwright/test';
import { getTestablePages, type PageEntry } from './page-list';
import { runInteractionGroup } from './interaction-runner';

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

/**
 * 通用：导航到页面并等待渲染就绪
 */
async function navigateAndWait(page: Page, entry: PageEntry) {
  await page.goto(`/?is_playwright_test=1&page_name=${entry.name}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForPageReady(page, entry);
}

// 为每个可测试页面生成测试用例
for (const entry of testablePages) {
  // ─── 情况 1：有 customTest → 完全自定义 ───
  if (entry.customTest) {
    test(`[${entry.category}] ${entry.name}`, async ({ page }) => {
      await entry.customTest!(page);
    });
    continue;
  }

  // ─── 情况 2：普通页面（可能带交互组） ───
  test(`[${entry.category}] ${entry.name}`, async ({ page }) => {
    // 1. 导航到页面 & 等待渲染
    await navigateAndWait(page, entry);

    // 2. 初始状态截图（所有页面都截）
    await expect(page).toHaveScreenshot(`${entry.name}.png`, {
      fullPage: true,
    });

    // 3. 如果定义了交互组，依次执行并截图
    if (entry.interactions?.length) {
      for (const group of entry.interactions) {
        await runInteractionGroup(page, group);
        await expect(page).toHaveScreenshot(
          `${entry.name}-${group.screenshotSuffix}.png`,
          { fullPage: true },
        );
      }
    }
  });
}
