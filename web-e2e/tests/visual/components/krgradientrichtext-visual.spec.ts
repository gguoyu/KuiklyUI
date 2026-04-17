import { test, expect } from '../../../fixtures/test-base';

test.describe('KRGradientRichTextView visual 验证', () => {
  test('应该保持渐变富文本页面视觉稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('krgradientrichtext-test.png', {
      maxDiffPixels: 200,
    });
  });
});
