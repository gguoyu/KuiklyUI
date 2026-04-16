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
  points: Array<{ type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel'; x?: number; y?: number; id?: number }>
) {
  for (const point of points) {
    const touchPoints = point.type === 'touchEnd' || point.type === 'touchCancel'
      ? []
      : [{ x: point.x ?? 0, y: point.y ?? 0, radiusX: 2, radiusY: 2, force: 1, id: point.id ?? 1 }];
    await client.send('Input.dispatchTouchEvent', {
      type: point.type,
      touchPoints,
    });
  }
}

async function installRuntimeProbe(
  page: import('@playwright/test').Page,
  type: 'pan' | 'longPress',
  probeId: string,
) {
  await page.evaluate(({ type, probeId }) => {
    const runtime = globalThis as typeof globalThis & Record<string, any>;
    const baseModule = runtime['KuiklyCore-render-web-base'];
    const eventProcessor = baseModule?.$_$?.l3?.()?.eventProcessor_1;
    if (!eventProcessor) {
      throw new Error('EventProcessor is not available on the page');
    }

    const methodName = Object.getOwnPropertyNames(Object.getPrototypeOf(eventProcessor))
      .find((name) => name.startsWith(`${type}_`) && !name.includes('$default'));
    if (!methodName) {
      throw new Error(`EventProcessor method not found for ${type}`);
    }

    runtime.__cbEventProcessorProbe = [];
    runtime.document.getElementById(probeId)?.remove();

    const probe = runtime.document.createElement('div');
    probe.id = probeId;
    Object.assign(probe.style, {
      position: 'fixed',
      left: '96px',
      top: '96px',
      width: '128px',
      height: '128px',
      zIndex: '99999',
      background: 'rgba(255, 0, 0, 0.12)',
    });
    runtime.document.body.appendChild(probe);

    eventProcessor[methodName](probe, (event: any) => {
      runtime.__cbEventProcessorProbe.push({
        state: event?.state ?? null,
        clientX: event?.clientX_1 ?? event?.clientX ?? null,
        clientY: event?.clientY_1 ?? event?.clientY ?? null,
        pageX: event?.pageX_1 ?? event?.pageX ?? null,
        pageY: event?.pageY_1 ?? event?.pageY ?? null,
      });
    });
  }, { type, probeId });
}

async function readRuntimeProbe(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & Record<string, any>;
    return [...(runtime.__cbEventProcessorProbe ?? [])];
  });
}

async function clearRuntimeProbe(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & Record<string, any>;
    runtime.__cbEventProcessorProbe = [];
  });
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

  test('touch long press should cancel on early movement and handle touchcancel after activation', async ({ kuiklyPage }) => {
    const client = await enableTouchEmulation(kuiklyPage.page);
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const longPressTarget = kuiklyPage.page.getByText('长按此区域', { exact: true });
    const box = await longPressTarget.boundingBox();
    if (!box) {
      throw new Error('long press target is not visible');
    }

    const centerX = Math.round(box.x + box.width / 2);
    const centerY = Math.round(box.y + box.height / 2);

    await dispatchTouchSequence(client, [{ type: 'touchStart', x: centerX, y: centerY }]);
    await kuiklyPage.page.waitForTimeout(150);
    await dispatchTouchSequence(client, [{ type: 'touchMove', x: centerX + 24, y: centerY }]);
    await kuiklyPage.page.waitForTimeout(100);
    await dispatchTouchSequence(client, [{ type: 'touchEnd' }]);
    await kuiklyPage.page.waitForTimeout(800);
    await expect(kuiklyPage.page.getByText('长按状态: 未激活')).toBeVisible();

    await dispatchTouchSequence(client, [{ type: 'touchStart', x: centerX, y: centerY }]);
    await kuiklyPage.page.waitForTimeout(820);
    await expect(kuiklyPage.page.getByText('长按状态: 已激活')).toBeVisible();

    await dispatchTouchSequence(client, [{ type: 'touchCancel' }]);
    await kuiklyPage.page.waitForTimeout(200);
    await expect(kuiklyPage.page.getByText('长按状态: 已激活')).toBeVisible();
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

  test('direct mouse pan probe should emit start move end states', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();
    await installRuntimeProbe(kuiklyPage.page, 'pan', 'cb-probe-pan-mouse');

    await kuiklyPage.page.mouse.move(120, 120);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(188, 120, { steps: 6 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(120);

    const events = await readRuntimeProbe(kuiklyPage.page);
    const states = events.map((event) => event.state);
    expect(states[0]).toBe('start');
    expect(states).toContain('move');
    expect(states.at(-1)).toBe('end');
  });

  test('direct touch pan probe should cover cancel and end paths', async ({ kuiklyPage }) => {
    const client = await enableTouchEmulation(kuiklyPage.page);
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();
    await installRuntimeProbe(kuiklyPage.page, 'pan', 'cb-probe-pan-touch');

    await dispatchTouchSequence(client, [
      { type: 'touchStart', x: 160, y: 160 },
      { type: 'touchMove', x: 208, y: 160 },
      { type: 'touchCancel' },
    ]);
    await kuiklyPage.page.waitForTimeout(120);

    let events = await readRuntimeProbe(kuiklyPage.page);
    let states = events.map((event) => event.state);
    expect(states[0]).toBe('start');
    expect(states).toContain('move');
    expect(states).not.toContain('end');

    await clearRuntimeProbe(kuiklyPage.page);

    await dispatchTouchSequence(client, [
      { type: 'touchStart', x: 160, y: 160 },
      { type: 'touchMove', x: 214, y: 160 },
      { type: 'touchEnd' },
    ]);
    await kuiklyPage.page.waitForTimeout(120);

    events = await readRuntimeProbe(kuiklyPage.page);
    states = events.map((event) => event.state);
    expect(states[0]).toBe('start');
    expect(states).toContain('move');
    expect(states.at(-1)).toBe('end');
  });

  test('direct touch longPress probe should cover cancel move and end paths', async ({ kuiklyPage }) => {
    const client = await enableTouchEmulation(kuiklyPage.page);
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();
    await installRuntimeProbe(kuiklyPage.page, 'longPress', 'cb-probe-longpress-touch');

    await dispatchTouchSequence(client, [
      { type: 'touchStart', x: 160, y: 160 },
    ]);
    await kuiklyPage.page.waitForTimeout(120);
    await dispatchTouchSequence(client, [
      { type: 'touchMove', x: 196, y: 160 },
      { type: 'touchEnd' },
    ]);
    await kuiklyPage.page.waitForTimeout(820);

    let events = await readRuntimeProbe(kuiklyPage.page);
    expect(events).toHaveLength(0);

    await clearRuntimeProbe(kuiklyPage.page);

    await dispatchTouchSequence(client, [
      { type: 'touchStart', x: 160, y: 160 },
    ]);
    await kuiklyPage.page.waitForTimeout(820);
    await dispatchTouchSequence(client, [
      { type: 'touchMove', x: 184, y: 166 },
    ]);
    await kuiklyPage.page.waitForTimeout(120);
    await dispatchTouchSequence(client, [
      { type: 'touchEnd' },
    ]);
    await kuiklyPage.page.waitForTimeout(150);

    events = await readRuntimeProbe(kuiklyPage.page);
    let states = events.map((event) => event.state);
    expect(states[0]).toBe('start');
    expect(states).toContain('move');
    expect(states).not.toContain('end');

    await clearRuntimeProbe(kuiklyPage.page);

    await dispatchTouchSequence(client, [
      { type: 'touchStart', x: 160, y: 160 },
    ]);
    await kuiklyPage.page.waitForTimeout(820);
    await dispatchTouchSequence(client, [{ type: 'touchCancel' }]);
    await kuiklyPage.page.waitForTimeout(120);

    events = await readRuntimeProbe(kuiklyPage.page);
    states = events.map((event) => event.state);
    expect(states).toEqual(['start']);
  });

  test('direct dispatchMouseEvent probe should dispatch to target element when provided', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const dispatchEvents = await kuiklyPage.page.evaluate(() => {
      const runtime = globalThis as typeof globalThis & Record<string, any>;
      const baseModule = runtime['KuiklyCore-render-web-base'];
      const eventProcessor = baseModule?.$_$?.l3?.()?.eventProcessor_1;
      if (!eventProcessor) {
        throw new Error('EventProcessor is not available on the page');
      }

      const methodName = Object.getOwnPropertyNames(Object.getPrototypeOf(eventProcessor))
        .find((name) => name.startsWith('dispatchMouseEvent_') && !name.includes('$default'));
      if (!methodName) {
        throw new Error('dispatchMouseEvent method not found');
      }

      const target = runtime.document.createElement('div');
      target.id = 'cb-dispatch-target';
      runtime.document.body.appendChild(target);
      runtime.__cbDispatchProbe = [];

      target.addEventListener('mousedown', (event: Event) => {
        const detail = (event as CustomEvent).detail as Record<string, any> | undefined;
        runtime.__cbDispatchProbe.push({
          scope: 'element',
          type: event.type,
          clientX: detail?.clientX ?? detail?.clientX_1 ?? null,
        });
      });
      runtime.addEventListener('mouseup', (event: Event) => {
        const detail = (event as CustomEvent).detail as Record<string, any> | undefined;
        runtime.__cbDispatchProbe.push({
          scope: 'window',
          type: event.type,
          clientX: detail?.clientX ?? detail?.clientX_1 ?? null,
        });
      }, { once: true });

      eventProcessor[methodName]('mousedown', new MouseEvent('mousedown', { clientX: 18, clientY: 24 }), target);
      eventProcessor[methodName]('mouseup', new MouseEvent('mouseup', { clientX: 36, clientY: 42 }), null);
      target.remove();
      return [...runtime.__cbDispatchProbe];
    });

    expect(dispatchEvents).toEqual([
      { scope: 'element', type: 'mousedown', clientX: 18 },
      { scope: 'window', type: 'mouseup', clientX: 36 },
    ]);
  });
});
