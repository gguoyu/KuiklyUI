import { test, expect } from '../../../fixtures/test-base';

test.describe('KRTextView visual 验证', () => {
  test('视觉回归：KRTextViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('krtext-test.png', {
      maxDiffPixels: 100,
    });
  });
});
