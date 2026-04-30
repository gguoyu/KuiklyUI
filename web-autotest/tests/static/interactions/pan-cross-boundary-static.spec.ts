import { test, expect } from '../../../fixtures/test-base';

test.describe('PanCrossBoundaryTestPage static', () => {
  test('should render pan and longPress areas', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PanCrossBoundaryTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Pan & LongPress Test', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('1. Pan Area (drag outside)', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. EventProcessor Pan Area', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. LongPress Area', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. Pan in ListView', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('event-processor-pan-idle count:0', { exact: true })).toBeVisible();
  });

  test('should trigger pan events on drag', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PanCrossBoundaryTestPage');
    await kuiklyPage.waitForRenderComplete();

    const panArea = kuiklyPage.page.getByText('pan-idle count:0', { exact: true });
    await expect(panArea).toBeVisible();

    const box = await panArea.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + 20, box.y + 20);
      await kuiklyPage.page.mouse.down();
      await kuiklyPage.page.mouse.move(box.x + 100, box.y + 100, { steps: 10 });
      await kuiklyPage.page.mouse.up();
    }

    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/^pan-(?:start|move|end) count:[1-9]\d*$/, { exact: false })).toBeVisible();
  });
});
