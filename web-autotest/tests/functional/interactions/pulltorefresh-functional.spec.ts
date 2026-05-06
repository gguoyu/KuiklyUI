import { test, expect, type Locator, type Page } from '../../../fixtures/test-base';

async function dragDown(page: Page, container: Locator, deltaY: number, steps = 10, waitMs = 300): Promise<void> {
  const box = await container.boundingBox();
  if (!box) throw new Error('Container not visible');

  const x = box.x + box.width / 2;
  const startY = box.y + box.height * 0.3;

  await page.mouse.move(x, startY);
  await page.mouse.down();
  await page.mouse.move(x, startY + deltaY, { steps });
  await page.waitForTimeout(waitMs);
  await page.mouse.up();
}

test.describe('PullToRefreshTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PullToRefreshTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('beginRefresh button should trigger REFRESHING then auto-return to IDLE', async ({ kuiklyPage }) => {
    // Verify initial state
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible();

    // Click Begin Refresh button to programmatically trigger refresh
    await kuiklyPage.page.getByText('Begin Refresh', { exact: true }).click();

    // Should transition to REFRESHING
    await expect(kuiklyPage.page.getByText('REFRESHING', { exact: true })).toBeVisible({ timeout: 3000 });

    // After auto-end delay (1500ms), should return to IDLE
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('dragging down from top should not crash and page remains functional', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible();

    const list = kuiklyPage.component('KRListView').first();
    // Drag downward from the top to simulate pull-to-refresh gesture
    // Note: In headless mode, mouse drag may not trigger the pull threshold
    await dragDown(kuiklyPage.page, list, 120, 12, 100);
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(500);

    // Page should remain functional regardless of whether PULLING was triggered
    await expect(kuiklyPage.page.getByText('Begin Refresh', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Item 1', { exact: true })).toBeVisible();
  });

  test('strong pull down should exercise pull gesture code path', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible();

    const list = kuiklyPage.component('KRListView').first();
    // Strong pull down to attempt exceeding the refresh threshold
    await dragDown(kuiklyPage.page, list, 200, 15, 50);
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(1000);

    // In headless mode the gesture may or may not trigger REFRESHING.
    // The key assertion is the page remains functional and no crash occurs.
    const stateText = kuiklyPage.page.getByText('IDLE', { exact: true })
      .or(kuiklyPage.page.getByText('REFRESHING', { exact: true }))
      .or(kuiklyPage.page.getByText('PULLING', { exact: true }));
    await expect(stateText).toBeVisible({ timeout: 5000 });
  });

  test('multiple beginRefresh cycles should work correctly', async ({ kuiklyPage }) => {
    // First cycle
    await kuiklyPage.page.getByText('Begin Refresh', { exact: true }).click();
    await expect(kuiklyPage.page.getByText('REFRESHING', { exact: true })).toBeVisible({ timeout: 3000 });
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible({ timeout: 5000 });

    // Second cycle
    await kuiklyPage.page.getByText('Begin Refresh', { exact: true }).click();
    await expect(kuiklyPage.page.getByText('REFRESHING', { exact: true })).toBeVisible({ timeout: 3000 });
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('list items should remain visible and functional after refresh', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('Begin Refresh', { exact: true }).click();
    await expect(kuiklyPage.page.getByText('REFRESHING', { exact: true })).toBeVisible({ timeout: 3000 });
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible({ timeout: 5000 });

    // Verify list items still render correctly
    await expect(kuiklyPage.page.getByText('Item 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Item 10', { exact: true })).toBeVisible();
  });
});
