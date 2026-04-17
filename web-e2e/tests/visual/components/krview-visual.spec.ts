import { test, expect } from '../../../fixtures/test-base';

test.describe('KRView 视觉验证', () => {
  test('视觉回归：KRViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('krview-test.png', {
      maxDiffPixels: 100,
    });
  });
});
