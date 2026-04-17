import { test, expect } from '../../../fixtures/test-base';

test.describe('Shadow visual 验证', () => {
  test('视觉回归：ShadowTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('shadow-test.png', {
      maxDiffPixels: 200,
    });
  });
});
