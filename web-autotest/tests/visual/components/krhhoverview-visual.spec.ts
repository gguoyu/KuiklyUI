import { test, expect } from '../../../fixtures/test-base';

test.describe('KRHoverView visual 验证', () => {
  test('应该保持 KRHoverView 页面视觉稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRHoverViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('kr-hover-view-test-page.png', {
      maxDiffPixels: 200,
    });
  });
});
