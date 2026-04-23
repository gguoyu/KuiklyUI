import { test, expect } from '../../../fixtures/test-base';

test.describe('KRVideoView visual 验证', () => {
  test('应该保持 KRVideoView 页面视觉稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('kr-video-view-test-page.png', {
      maxDiffPixels: 300,
    });
  });
});
