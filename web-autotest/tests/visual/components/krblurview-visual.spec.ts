import { test, expect } from '../../../fixtures/test-base';

test.describe('KRBlurView visual 验证', () => {
  test('KRBlurViewTestPage 应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRBlurViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('kr-blur-view-test-page.png', {
      maxDiffPixels: 200,
    });
  });
});
