import { test, expect } from '../../../fixtures/test-base';

test.describe('pull-to-refresh static 验证', () => {
  test('should load PullToRefreshTestPage and render list with refresh indicator', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PullToRefreshTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Verify list items are rendered
    await expect(kuiklyPage.page.getByText('Item 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Item 25', { exact: true })).toBeVisible();

    // Verify the Begin Refresh button is rendered
    await expect(kuiklyPage.page.getByText('Begin Refresh', { exact: true })).toBeVisible();
  });

  test('should trigger beginRefresh programmatically', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PullToRefreshTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Click the Begin Refresh button
    await kuiklyPage.page.getByText('Begin Refresh', { exact: true }).click();

    // Wait for the refresh state text to change to REFRESHING
    await expect(kuiklyPage.page.getByText('REFRESHING', { exact: true })).toBeVisible({ timeout: 3000 });

    // After the auto-end delay, the state should return to IDLE
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible({ timeout: 5000 });
  });
});
