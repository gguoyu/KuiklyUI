import { test, expect } from '../../../fixtures/test-base';

test.describe('KRScrollContentView visual 验证', () => {
  test('KRScrollContentViewTestPage 应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('krscrollcontent-test.png', {
      maxDiffPixels: 200,
    });
  });
});
