import { test, expect } from '../../fixtures/test-base';

test.describe('Smoke visual 验证', () => {
  test('SmokeTestPage 应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SmokeTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(1000);

    await expect(kuiklyPage.page).toHaveScreenshot('smoke-test-page.png', {
      maxDiffPixels: 100,
    });
  });
});
