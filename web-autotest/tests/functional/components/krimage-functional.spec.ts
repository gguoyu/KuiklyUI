import { test, expect } from '../../../fixtures/test-base';

test.describe('KRImageView functional 验证', () => {
  test('无效 src 应触发 loadFailure 回调', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Load Failure', { exact: false })).toBeVisible();

    // Wait for the image error event to fire (invalid URL)
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /load-failure-count:(?!0)/ }).first())
      .toBeVisible({ timeout: 10000 });
  });
});
