import type { CDPSession, Locator, Page } from '@playwright/test';

import { test, expect } from '../../fixtures/test-base';

type TouchPointStep = {
  type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel';
  x?: number;
  y?: number;
  id?: number;
};

async function enableTouchEmulation(page: Page): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
  });
  return client;
}

async function dispatchTouchSequence(client: CDPSession, points: TouchPointStep[]): Promise<void> {
  for (const point of points) {
    const touchPoints = point.type === 'touchEnd' || point.type === 'touchCancel'
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

async function getCenter(target: Locator): Promise<{ x: number; y: number }> {
  await expect(target).toBeVisible();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('Touch target is not visible');
  }

  return {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2),
  };
}

async function touchTap(client: CDPSession, target: Locator, repeat = 1): Promise<void> {
  const page = target.page();
  const { x, y } = await getCenter(target);

  for (let index = 0; index < repeat; index += 1) {
    await dispatchTouchSequence(client, [
      { type: 'touchStart', x, y },
      { type: 'touchEnd' },
    ]);

    if (index < repeat - 1) {
      await page.waitForTimeout(60);
    }
  }
}

async function touchHold(
  client: CDPSession,
  target: Locator,
  holdMs = 850,
  options: {
    moveBy?: { dx: number; dy: number };
    finish?: 'touchEnd' | 'touchCancel';
  } = {},
): Promise<void> {
  const page = target.page();
  const { x, y } = await getCenter(target);

  await dispatchTouchSequence(client, [{ type: 'touchStart', x, y }]);
  await page.waitForTimeout(holdMs);

  if (options.moveBy) {
    await dispatchTouchSequence(client, [{
      type: 'touchMove',
      x: x + options.moveBy.dx,
      y: y + options.moveBy.dy,
    }]);
    await page.waitForTimeout(120);
  }

  await dispatchTouchSequence(client, [{ type: options.finish ?? 'touchEnd' }]);
}

async function dispatchSyntheticTouch(
  page: Page,
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  point: { x: number; y: number } | null,
  changedPoint: { x: number; y: number },
): Promise<void> {
  await page.evaluate(({ type, point, changedPoint }) => {
    const eventTarget = document.elementFromPoint(changedPoint.x, changedPoint.y) ?? document.body;
    const buildTouch = (x: number, y: number) => ({
      identifier: 1,
      target: eventTarget,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      screenX: x,
      screenY: y,
      radiusX: 5,
      radiusY: 5,
      rotationAngle: 0,
      force: 1,
    });

    const changedTouch = buildTouch(changedPoint.x, changedPoint.y);
    const activeTouch = point ? buildTouch(point.x, point.y) : null;
    const event = new Event(type, {
      bubbles: true,
      cancelable: true,
    });

    Object.defineProperties(event, {
      touches: {
        value: activeTouch ? [activeTouch] : [],
        configurable: true,
      },
      changedTouches: {
        value: [changedTouch],
        configurable: true,
      },
      targetTouches: {
        value: activeTouch ? [activeTouch] : [],
        configurable: true,
      },
    });

    eventTarget.dispatchEvent(event);
  }, { type, point, changedPoint });
}

async function touchStartMoveEnd(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
  options: {
    steps?: number;
    finish?: 'touchEnd' | 'touchCancel';
  } = {},
): Promise<void> {
  const steps = options.steps ?? 8;
  let current = start;

  await dispatchSyntheticTouch(page, 'touchstart', start, start);

  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    current = {
      x: Math.round(start.x + (end.x - start.x) * progress),
      y: Math.round(start.y + (end.y - start.y) * progress),
    };
    await dispatchSyntheticTouch(page, 'touchmove', current, current);
    await page.waitForTimeout(16);
  }

  await dispatchSyntheticTouch(
    page,
    options.finish === 'touchCancel' ? 'touchcancel' : 'touchend',
    null,
    current,
  );
}

async function getLeft(target: Locator): Promise<number> {
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

test.describe('EventProcessor touch branches functional', () => {
  test('touch 双击应触发 ButtonEventTestPage 的 doubleClick 文案更新', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ButtonEventTestPage');
    await kuiklyPage.waitForRenderComplete();
    const client = await enableTouchEmulation(kuiklyPage.page);

    await touchTap(client, kuiklyPage.page.getByText('double-button', { exact: true }), 2);
    await kuiklyPage.page.waitForTimeout(300);

    await expect(kuiklyPage.page.getByText('double-once', { exact: true })).toBeVisible();
  });

  test('touch 长按应触发 ButtonEventTestPage 的 longPress 文案更新', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ButtonEventTestPage');
    await kuiklyPage.waitForRenderComplete();
    const client = await enableTouchEmulation(kuiklyPage.page);

    await touchHold(client, kuiklyPage.page.getByText('long-button', { exact: true }));
    await kuiklyPage.page.waitForTimeout(250);

    await expect(kuiklyPage.page.getByText('long-once', { exact: true })).toBeVisible();
  });

  test('touch 长按在提前移动时不应激活，激活后 touchCancel 不应回退状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();
    const client = await enableTouchEmulation(kuiklyPage.page);

    const longPressTarget = kuiklyPage.page.getByText('long-press-area', { exact: true });
    const { x, y } = await getCenter(longPressTarget);

    await dispatchTouchSequence(client, [{ type: 'touchStart', x, y }]);
    await kuiklyPage.page.waitForTimeout(150);
    await dispatchTouchSequence(client, [{ type: 'touchMove', x: x + 24, y }]);
    await kuiklyPage.page.waitForTimeout(100);
    await dispatchTouchSequence(client, [{ type: 'touchEnd' }]);
    await kuiklyPage.page.waitForTimeout(800);
    await expect(kuiklyPage.page.getByText('long-press-status: inactive')).toBeVisible();

    await dispatchTouchSequence(client, [{ type: 'touchStart', x, y }]);
    await kuiklyPage.page.waitForTimeout(820);
    await expect(kuiklyPage.page.getByText('long-press-status: active')).toBeVisible();

    await dispatchTouchSequence(client, [{ type: 'touchCancel' }]);
    await kuiklyPage.page.waitForTimeout(200);
    await expect(kuiklyPage.page.getByText('long-press-status: active')).toBeVisible();
  });

  test('touch 长按激活后轻微移动时应触发 move 分支并回写取消日志', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();
    const client = await enableTouchEmulation(kuiklyPage.page);

    await touchHold(client, kuiklyPage.page.getByText('long-press-area', { exact: true }), 820, {
      moveBy: { dx: 24, dy: 6 },
    });
    await kuiklyPage.page.waitForTimeout(150);

    await expect(kuiklyPage.page.getByText('long-press-status: inactive')).toBeVisible();
    await expect(kuiklyPage.page.getByText('gesture-log: long-press-cancelled')).toBeVisible();
  });

  test('touch pan 从非左侧边缘开始拖拽时不应触发页面位移', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const title = kuiklyPage.page.getByText('capture-title', { exact: true });
    const initialLeft = await getLeft(title);

    await touchStartMoveEnd(kuiklyPage.page, { x: 160, y: 120 }, { x: 320, y: 120 });
    await kuiklyPage.page.waitForTimeout(500);

    const finalLeft = await getLeft(title);
    expect(Math.abs(finalLeft - initialLeft)).toBeLessThan(5);
  });

});
