import { test, expect } from '../../../fixtures/test-base';

test.describe('ListViewWheelTestPage functional', () => {
  test('should wheel scroll vertical list', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListViewWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Find the wheel scroll list section
    const wheelItem = kuiklyPage.page.getByText('Wheel Item 0', { exact: true });
    await expect(wheelItem).toBeVisible();

    const box = await wheelItem.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await kuiklyPage.page.mouse.wheel(0, 300);
      await kuiklyPage.page.waitForTimeout(500);
    }

    // Should still show wheel items
    await expect(kuiklyPage.page.getByText('Wheel Item 5', { exact: true })).toBeVisible();
  });

  test('should select horizontal item', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListViewWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    const hItem = kuiklyPage.page.getByText('H3', { exact: true });
    await expect(hItem).toBeVisible();
    await hItem.click();
    await kuiklyPage.page.waitForTimeout(300);

    // Item should still be visible after click
    await expect(hItem).toBeVisible();
  });
});
