import { test, expect } from '../../../fixtures/test-base';

test.describe('ListViewWheelTestPage static', () => {
  test('should render horizontal list and refresh list', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListViewWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('ListView Wheel & Refresh', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('1. Horizontal List', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. Pull Refresh (scroll down)', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Wheel Scroll List', { exact: false })).toBeVisible();
  });

  test('should scroll horizontal list', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListViewWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    const hItem = kuiklyPage.page.getByText('H5', { exact: true });
    await expect(hItem).toBeVisible();

    // Click to select
    await hItem.click();
    await kuiklyPage.page.waitForTimeout(300);
  });
});
