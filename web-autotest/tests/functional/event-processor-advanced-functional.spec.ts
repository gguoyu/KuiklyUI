import { test, expect, type Locator } from '../../fixtures/test-base';

async function longPressAndDragOut(target: Locator, holdMs: number = 850) {
  const box = await target.boundingBox();
  if (!box) throw new Error('Target not visible');

  const page = target.page();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // Start mousedown inside the element
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  // Wait for long press to trigger (700ms + margin)
  await page.waitForTimeout(holdMs);
  // Move mouse outside the element to trigger mouseleave
  await page.mouse.move(cx, cy - box.height - 50, { steps: 20 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(200);
}

test.describe('EventProcessor advanced functional', () => {
  test('longPress should cancel when mouse leaves the element', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const target = kuiklyPage.page.getByText('long-press-area', { exact: true });
    await target.scrollIntoViewIfNeeded();

    const box = await target.boundingBox();
    if (!box) throw new Error('Long press target not visible');

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Mousedown on long-press area
    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    // Move outside quickly (within 700ms) to trigger mouseleave cancel
    await kuiklyPage.page.mouse.move(cx, cy - box.height - 30, { steps: 5 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(200);

    // Long press should NOT have activated
    await expect(kuiklyPage.page.getByText('long-press-status: inactive', { exact: false })).toBeVisible();
  });

  test('pan should not activate during longPress (mutual exclusion)', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    // First, trigger long press on the long-press area
    const longPressArea = kuiklyPage.page.getByText('long-press-area', { exact: true });
    await longPressArea.scrollIntoViewIfNeeded();
    const box = await longPressArea.boundingBox();
    if (!box) throw new Error('Long press area not visible');

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.waitForTimeout(850); // Wait for long press
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(200);

    // Long press should have activated
    await expect(kuiklyPage.page.getByText('long-press-status: active', { exact: false })).toBeVisible();
  });
});
