import { test, expect } from '../../../fixtures/test-base';

test.describe('Border / BorderRadius visual 验证', () => {
  test('视觉回归：BorderTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('border-test.png', {
      maxDiffPixels: 100,
    });
  });
});
