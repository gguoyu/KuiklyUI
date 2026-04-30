import { test, expect } from '../../../fixtures/test-base';
import type { CDPSession, Page } from '@playwright/test';

async function enableTouchEmulation(page: Page): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
  });
  return client;
}

async function dispatchTouchSequence(
  client: CDPSession,
  points: Array<{
    type: 'touchStart' | 'touchMove' | 'touchEnd';
    x?: number;
    y?: number;
    id?: number;
  }>,
): Promise<void> {
  for (const point of points) {
    const touchPoints = point.type === 'touchEnd'
      ? []
      : [{
        x: point.x ?? 0,
        y: point.y ?? 0,
        radiusX: 5,
        radiusY: 5,
        force: 1,
        id: point.id ?? 1,
      }];

    await client.send('Input.dispatchTouchEvent', {
      type: point.type,
      touchPoints,
    });
  }
}

async function touchStartMoveEnd(
  client: CDPSession,
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
  steps = 8,
): Promise<void> {
  await dispatchTouchSequence(client, [{ type: 'touchStart', x: start.x, y: start.y }]);

  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    await dispatchTouchSequence(client, [{
      type: 'touchMove',
      x: Math.round(start.x + (end.x - start.x) * progress),
      y: Math.round(start.y + (end.y - start.y) * progress),
    }]);
    await page.waitForTimeout(16);
  }

  await dispatchTouchSequence(client, [{ type: 'touchEnd' }]);
}

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

  test('should trigger EventProcessor pan touch start move and end on non-KRView text area', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PanCrossBoundaryTestPage');
    await kuiklyPage.waitForRenderComplete();
    const client = await enableTouchEmulation(kuiklyPage.page);

    const panArea = kuiklyPage.page.getByText('event-processor-pan-idle count:0', { exact: true });
    await expect(panArea).toBeVisible();
    const box = await panArea.boundingBox();
    expect(box).toBeTruthy();

    const start = {
      x: Math.round(box!.x + box!.width / 2),
      y: Math.round(box!.y + box!.height / 2),
    };
    const end = {
      x: start.x + 70,
      y: start.y + 12,
    };

    await touchStartMoveEnd(client, kuiklyPage.page, start, end, 6);
    await kuiklyPage.page.waitForTimeout(300);

    await expect(kuiklyPage.page.getByText(/^event-processor-pan-end count:[1-9]\d*$/, { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText(/event-processor-pan-trace:start(?:>move)+>end/, { exact: false })).toBeVisible();
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
