import { test, expect } from '../../../fixtures/test-base';

test.describe('Opacity visual 验证', () => {
  test('视觉回归：OpacityTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('opacity-test.png', {
      maxDiffPixels: 100,
    });
  });
});
