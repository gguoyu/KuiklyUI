import { test, expect } from '../../../fixtures/test-base';

test.describe('KRListView visual 验证', () => {
  test('KRListViewTestPage 应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRListViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('krlist-static.png', {
      maxDiffPixels: 100,
    });
  });
});
