/**
 * functional 测试：KRBlurView 模糊组件
 *
 * 测试页面：KRBlurViewTestPage
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRBlurView functional 验证', () => {
  test('Blur 组件应正确渲染 blurRadius 属性', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRBlurViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // The page should show the Blur Component section
    await expect(kuiklyPage.page.getByText('Blur Component (KRBlurView)', { exact: false })).toBeVisible();

    // Verify the backdrop-filter is applied to the Blur element
    const blurElement = kuiklyPage.page.locator('[data-kuikly-component="KRBlurView"]');
    await expect(blurElement.first()).toBeVisible();

    const backdropFilter = await blurElement.first().evaluate((el) => {
      return window.getComputedStyle(el).backdropFilter || window.getComputedStyle(el).webkitBackdropFilter;
    });
    expect(backdropFilter).toContain('blur');
  });
});
