import { test, expect } from '../../../fixtures/test-base';

test.describe('KRImageView static 验证', () => {
  test('应成功加载 KRImageViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. resizeContain')).toBeVisible();
  });

  test('应渲染图片组件与章节标题', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(1000);

    const images = await kuiklyPage.components('KRImageView');
    expect(images.length).toBeGreaterThan(0);
    await expect(kuiklyPage.page.getByText('2. resizeCover')).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. resizeStretch')).toBeVisible();
  });
});

test.describe('KRImageTintColorTestPage static 验证', () => {
  test('应渲染带 tintColor 的图片列表', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageTintColorTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForLoadState('networkidle');

    await expect(kuiklyPage.page.getByText('KRImageTintColorTestPage')).toBeVisible();

    const images = await kuiklyPage.components('KRImageView');
    expect(images.length).toBeGreaterThanOrEqual(10);
    await expect(kuiklyPage.page.locator('text=tintColor: WHITE').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('text=tintColor: RED').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('text=tintColor: GREEN').first()).toBeVisible();
  });

  test('tintColor 应为图片应用独立 SVG filter', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageTintColorTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForLoadState('networkidle');

    await expect(kuiklyPage.page.getByText('KRImageTintColorTestPage')).toBeVisible();

    const filters = await kuiklyPage.page
      .locator('[data-kuikly-component="KRImageView"] img')
      .evaluateAll((elements) =>
        elements.slice(0, 3).map((el) => window.getComputedStyle(el as HTMLElement).filter),
      );

    expect(filters).toHaveLength(3);
    filters.forEach((filterValue) => {
      expect(filterValue).toMatch(/url\("#tint-\d+"\)/);
    });
    expect(new Set(filters).size).toBe(3);

    const svgFilterCount = await kuiklyPage.page.evaluate(() => document.querySelectorAll('svg filter').length);
    expect(svgFilterCount).toBeGreaterThan(0);
  });
});
