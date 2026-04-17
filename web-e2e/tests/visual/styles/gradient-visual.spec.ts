import { test, expect } from '../../../fixtures/test-base';

test.describe('Gradient visual 验证', () => {
  test('GradientTestPage 应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('gradient-test.png', {
      maxDiffPixels: 100,
    });
  });
});
