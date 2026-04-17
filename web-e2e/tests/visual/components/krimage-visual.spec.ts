import { test, expect } from '../../../fixtures/test-base';

test.describe('KRImageView visual 验证', () => {
  test('KRImageViewTestPage 应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(2000);

    await expect(kuiklyPage.page).toHaveScreenshot('krimage-test.png', {
      maxDiffPixels: 500,
    });
  });
});
