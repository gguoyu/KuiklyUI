import { test, expect } from '../../fixtures/test-base';
import type { Locator } from '@playwright/test';

async function getLeft(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

test.describe('Event capture branch coverage', () => {
  test('dragging from outside the left edge should not move the page', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const title = kuiklyPage.page.getByText('capture-title', { exact: true });
    const initialLeft = await getLeft(title);

    await kuiklyPage.page.mouse.move(160, 120);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(320, 120, { steps: 12 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(600);

    const finalLeft = await getLeft(title);
    expect(Math.abs(finalLeft - initialLeft)).toBeLessThan(5);
  });

  test('medium drag from the left edge should stop at a partial translation ratio', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const title = kuiklyPage.page.getByText('capture-title', { exact: true });
    const initialLeft = await getLeft(title);

    await kuiklyPage.page.mouse.move(24, 120);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(120, 120, { steps: 10 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(600);

    const finalLeft = await getLeft(title);
    expect(finalLeft - initialLeft).toBeGreaterThan(20);
    expect(finalLeft - initialLeft).toBeLessThan(120);
  });
});
