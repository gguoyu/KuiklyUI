import { test, expect, Page } from '@playwright/test';
import {
  getPagesByCategory,
  categories,
  type PageEntry,
} from './page-list';

/**
 * 按分类组织的视觉回归测试
 *
 * 使用方法:
 *   测试所有分类:        npx playwright test tests/category.spec.ts
 *   只测试 compose 分类: npx playwright test tests/category.spec.ts --grep "compose"
 *   只测试 demo 分类:    npx playwright test tests/category.spec.ts --grep "demo"
 */

async function waitForPageReady(page: Page, entry: PageEntry) {
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

  const waitTime = entry.waitTime ?? 2000;
  await page.waitForTimeout(waitTime);
}

for (const category of categories) {
  const pagesInCategory = getPagesByCategory(category);

  if (pagesInCategory.length === 0) continue;

  test.describe(`分类: ${category}`, () => {
    for (const entry of pagesInCategory) {
      test(`${entry.name}`, async ({ page }) => {
        await page.goto(`/?page_name=${entry.name}`, {
          waitUntil: 'domcontentloaded',
        });

        await waitForPageReady(page, entry);

        await expect(page).toHaveScreenshot(`${entry.name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  });
}
