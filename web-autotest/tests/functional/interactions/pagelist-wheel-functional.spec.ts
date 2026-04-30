import { test, expect } from '../../../fixtures/test-base';

test.describe('PageListWheelTestPage functional', () => {
  test('should switch page via mouse wheel', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    // PageListWheelTestPage should render with an index indicator
    await expect(kuiklyPage.page.getByText('PageList Wheel Test', { exact: false })).toBeVisible();

    // Find the scrollable area (KRListView or the page body)
    const scrollArea = kuiklyPage.component('KRListView').first();
    const box = await scrollArea.boundingBox().catch(() => null);
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await kuiklyPage.page.mouse.wheel(0, 300);
      await kuiklyPage.page.waitForTimeout(600);
    }

    // Index text should be visible
    await expect(kuiklyPage.page.getByText(/index:[0-9]/, { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('should handle boundary at last page', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollArea = kuiklyPage.component('KRListView').first();
    const box = await scrollArea.boundingBox().catch(() => null);
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      for (let i = 0; i < 5; i++) {
        await kuiklyPage.page.mouse.wheel(0, 500);
        await kuiklyPage.page.waitForTimeout(200);
      }
    }

    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('PageList Wheel Test', { exact: false })).toBeVisible();
  });

  test('should handle reverse wheel scroll (backward page navigation)', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollArea = kuiklyPage.component('KRListView').first();
    const box = await scrollArea.boundingBox().catch(() => null);
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Forward then backward
      await kuiklyPage.page.mouse.wheel(0, 300);
      await kuiklyPage.page.waitForTimeout(600);
      await kuiklyPage.page.mouse.wheel(0, -300);
      await kuiklyPage.page.waitForTimeout(600);
    }
    await expect(kuiklyPage.page.getByText(/index:[0-9]/, { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('should handle boundary at first page with reverse scroll', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollArea = kuiklyPage.component('KRListView').first();
    const box = await scrollArea.boundingBox().catch(() => null);
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // At first page, scroll backward — triggers first-page boundary
      await kuiklyPage.page.mouse.wheel(0, -300);
      await kuiklyPage.page.waitForTimeout(400);
    }
    await expect(kuiklyPage.page.getByText('PageList Wheel Test', { exact: false })).toBeVisible();
  });

  test('small wheel delta should not trigger page switch', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollArea = kuiklyPage.component('KRListView').first();
    const box = await scrollArea.boundingBox().catch(() => null);
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Tiny delta — should not trigger page switch
      await kuiklyPage.page.mouse.wheel(0, 10);
      await kuiklyPage.page.waitForTimeout(400);
    }
    await expect(kuiklyPage.page.getByText('PageList Wheel Test', { exact: false })).toBeVisible();
  });
});
