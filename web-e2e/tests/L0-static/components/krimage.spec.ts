/**
 * L0 静态渲染测试：KRImageView 图片渲染验证
 * 
 * 测试页面：KRImageViewTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 图片组件正确渲染
 * 3. 不同缩放模式/尺寸/圆角的视觉回归验证
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRImageView 渲染测试', () => {
  test('应该成功加载 KRImageViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. resizeContain')).toBeVisible();
  });

  test('应该正确渲染图片组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待图片加载完成
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(1000);

    // 验证 KRImageView 组件存在
    const images = await kuiklyPage.components('KRImageView');
    expect(images.length).toBeGreaterThan(0);

    // 验证各节标题可见
    await expect(kuiklyPage.page.locator('text=2. resizeCover')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. resizeStretch')).toBeVisible();

    console.log(`KRImageViewTestPage 渲染了 ${images.length} 个 KRImageView 组件`);
  });

  test('视觉回归：KRImageViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待图片加载完成
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(2000);

    // 视觉回归截图（图片可能有网络加载差异，允许更大的像素差异）
    await expect(kuiklyPage.page).toHaveScreenshot('krimage-test.png', {
      maxDiffPixels: 500,
    });
  });
});

test.describe('ImageTintColorReusePage 着色渲染测试', () => {
  test('应该渲染带 tintColor 的图片列表', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ImageTintColorReusePage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForLoadState('networkidle');

    const images = await kuiklyPage.components('KRImageView');
    expect(images.length).toBeGreaterThanOrEqual(10);

    await expect(kuiklyPage.page.locator('text=tintColor: WHITE').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('text=tintColor: RED').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('text=tintColor: GREEN').first()).toBeVisible();
  });

  test('tintColor 应为图片应用独立 SVG filter', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ImageTintColorReusePage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForLoadState('networkidle');

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
