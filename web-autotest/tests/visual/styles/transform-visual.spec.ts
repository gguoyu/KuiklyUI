import { test, expect } from '../../../fixtures/test-base';

test.describe('Transform visual 验证', () => {
  test('视觉回归：TransformTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('transform-test.png', {
      maxDiffPixels: 100,
    });
  });
});
