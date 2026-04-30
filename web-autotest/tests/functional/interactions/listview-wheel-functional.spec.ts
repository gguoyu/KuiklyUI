import { test, expect, type Locator, type Page } from '../../../fixtures/test-base';

async function pullDownInContainer(
  page: Page,
  container: Locator,
  deltaY: number,
  steps = 10,
): Promise<void> {
  const box = await container.boundingBox();
  expect(box).toBeTruthy();

  const startX = box!.x + box!.width / 2;
  const startY = box!.y + Math.min(36, box!.height * 0.2);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + deltaY, { steps });
  await page.mouse.up();
}

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

  test('short pull down should bounce back without starting refresh', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListViewWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    const refreshList = kuiklyPage.component('KRListView').nth(2);
    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('refreshCount:0', { exact: true })).toBeVisible();

    await pullDownInContainer(kuiklyPage.page, refreshList, 24, 6);
    await kuiklyPage.page.waitForTimeout(400);

    await expect(kuiklyPage.page.getByText('IDLE', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('refreshCount:0', { exact: true })).toBeVisible();
  });

});
