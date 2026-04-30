import { test, expect } from '../../../fixtures/test-base';

test.describe('PanCrossBoundaryTestPage functional', () => {
  test('should track KRView pan start and move states', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PanCrossBoundaryTestPage');
    await kuiklyPage.waitForRenderComplete();

    const panArea = kuiklyPage.page.getByText('pan-idle count:0', { exact: true });
    await expect(panArea).toBeVisible();

    const box = await panArea.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + 30, box.y + 30);
      await kuiklyPage.page.mouse.down();
      await kuiklyPage.page.waitForTimeout(100);
      await kuiklyPage.page.mouse.move(box.x + 200, box.y + 200, { steps: 10 });
      await kuiklyPage.page.mouse.up();
    }

    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/pan-.*count:[1-9]/, { exact: false })).toBeVisible();
  });

  test('should trigger EventProcessor pan on non-KRView text area', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PanCrossBoundaryTestPage');
    await kuiklyPage.waitForRenderComplete();

    const panArea = kuiklyPage.page.getByText('event-processor-pan-idle count:0', { exact: true });
    await expect(panArea).toBeVisible();

    const box = await panArea.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + 20, box.y + box.height / 2);
      await kuiklyPage.page.mouse.down();
      await kuiklyPage.page.waitForTimeout(100);
      await kuiklyPage.page.mouse.move(box.x + box.width + 120, box.y + box.height + 120, { steps: 10 });
      await kuiklyPage.page.mouse.up();
    }

    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/event-processor-pan-.*count:[1-9]/, { exact: false })).toBeVisible();
  });

  test('should trigger longPress on hold', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PanCrossBoundaryTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Find longPress area by text content
    const longPressArea = kuiklyPage.page.getByText(/lp-count:0/, { exact: false }).first();
    await expect(longPressArea).toBeVisible();

    const box = await longPressArea.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await kuiklyPage.page.mouse.down();
      await kuiklyPage.page.waitForTimeout(900); // Long press threshold ~700ms
      await kuiklyPage.page.mouse.up();
    }

    await kuiklyPage.page.waitForTimeout(300);
    // Count should have incremented
    await expect(kuiklyPage.page.getByText(/lp-count:[1-9]/, { exact: false })).toBeVisible();
  });
});
