import { test, expect } from '../../../fixtures/test-base';

test.describe('KRRichTextView visual 验证', () => {
  test('应该保持富文本页面视觉稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(1000);

    await expect(kuiklyPage.page).toHaveScreenshot('krrichtext-test.png', {
      maxDiffPixels: 300,
    });
  });
});
