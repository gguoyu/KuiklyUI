import { test, expect } from '../../fixtures/test-base';

async function enableTouchEmulation(page: import('@playwright/test').Page) {
  const context = page.context();
  // Chromium only: make runtime define TouchEvent so H5 touch branches execute.
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  return client;
}

async function dispatchTouchSequence(
  client: import('@playwright/test').CDPSession,
  points: Array<{ type: 'touchStart' | 'touchMove' | 'touchEnd'; x?: number; y?: number; id?: number }>
) {
  for (const point of points) {
    const touchPoints = point.type === 'touchEnd'
      ? []
      : [{ x: point.x ?? 0, y: point.y ?? 0, radiusX: 2, radiusY: 2, force: 1, id: point.id ?? 1 }];
    await client.send('Input.dispatchTouchEvent', {
      type: point.type,
      touchPoints,
    });
  }
}

test.describe('EventProcessor touch branches', () => {
  test('touch double tap and long press should trigger ButtonEventTestPage handlers', async ({ kuiklyPage }) => {
    const client = await enableTouchEmulation(kuiklyPage.page);
    await kuiklyPage.goto('ButtonEventTestPage');
    await kuiklyPage.waitForRenderComplete();

    await dispatchTouchSequence(client, [
      { type: 'touchStart', x: 80, y: 147 },
      { type: 'touchEnd' },
      { type: 'touchStart', x: 80, y: 147 },
      { type: 'touchEnd' },
    ]);
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText('double-once', { exact: true })).toBeVisible();

    await dispatchTouchSequence(client, [
      { type: 'touchStart', x: 80, y: 215 },
    ]);
    await kuiklyPage.page.waitForTimeout(820);
    await dispatchTouchSequence(client, [
      { type: 'touchEnd' },
    ]);
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText('long-once', { exact: true })).toBeVisible();
  });

  test('touch pan should move EventCaptureTestPage content from the left edge', async ({ kuiklyPage }) => {
    const client = await enableTouchEmulation(kuiklyPage.page);
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const title = kuiklyPage.page.getByText('capture-title', { exact: true });
    const before = await title.boundingBox();
    if (!before) {
      throw new Error('capture-title is not visible before touch pan');
    }

    await dispatchTouchSequence(client, [
      { type: 'touchStart', x: 24, y: 120 },
      { type: 'touchMove', x: 220, y: 120 },
    ]);
    await kuiklyPage.page.waitForTimeout(120);
    await dispatchTouchSequence(client, [{ type: 'touchEnd' }]);
    await kuiklyPage.page.waitForTimeout(500);

    const after = await title.boundingBox();
    if (!after) {
      throw new Error('capture-title is not visible after touch pan');
    }

    expect(after.x).toBeGreaterThan(before.x + 100);
  });
});
