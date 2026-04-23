import { test, expect } from '../../../fixtures/test-base';

test.describe('Overflow visual 验证', () => {
  test('视觉回归：OverflowTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OverflowTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('overflow-test.png', {
      maxDiffPixels: 100,
    });
  });
});
