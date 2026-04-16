import { test, expect } from '../../fixtures/test-base';

async function installResizeModuleProbe(page: import('@playwright/test').Page, pageName: string) {
  await page.evaluate(async ({ pageName }) => {
    const runtime = globalThis as typeof globalThis & Record<string, any>;
    const h5Module = runtime['KuiklyCore-render-web-h5'];
    const Delegator = h5Module?.$_$?.a;
    const KuiklyView = h5Module?.$_$?.b;
    if (!Delegator || !KuiklyView) {
      throw new Error('KuiklyRenderViewDelegator exports are not available');
    }

    const previous = runtime.__cbWindowResizeProbe;
    previous?.delegator?.onDetach_8dig02_k$?.();
    previous?.host?.remove?.();

    const host = runtime.document.createElement('div');
    host.id = 'cb-window-resize-probe-host';
    Object.assign(host.style, {
      position: 'fixed',
      left: '-9999px',
      top: '-9999px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      pointerEvents: 'none',
    });
    runtime.document.body.appendChild(host);

    const paramsRaw = {
      statusBarHeight: 0,
      activityWidth: runtime.window.innerWidth,
      activityHeight: runtime.window.innerHeight,
      param: {
        page_name: pageName,
        is_H5: '1',
      },
    };
    const params = {
      get_wei43m_k$: (key: string) => (key in paramsRaw ? paramsRaw[key as keyof typeof paramsRaw] : null),
    };
    const size = {
      get_first_irdx8n_k$: () => runtime.window.innerWidth,
      get_second_jf7fjx_k$: () => runtime.window.innerHeight,
    };

    const delegator = new Delegator(new KuiklyView());
    delegator.onAttach_2h6osc_k$(host, pageName, params, size);
    delegator.onResume_qbs84c_k$();

    let context = null;
    for (let attempt = 0; attempt < 20 && !context; attempt++) {
      context = delegator.getKuiklyRenderContext_qq892i_k$();
      if (!context) {
        await new Promise((resolve) => runtime.setTimeout(resolve, 50));
      }
    }
    if (!context) {
      throw new Error('KuiklyRenderViewContext is not ready');
    }

    const module = context.module_jvbaa1_k$('WindowResizeModule');
    if (!module) {
      throw new Error('WindowResizeModule is not available');
    }

    runtime.__cbWindowResizeProbe = {
      events: [],
      delegator,
      host,
      module,
    };
  }, { pageName });
}

async function startResizeModuleProbe(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & Record<string, any>;
    const probe = runtime.__cbWindowResizeProbe;
    if (!probe?.module) {
      throw new Error('Window resize probe is not installed');
    }

    probe.events = [];
    return probe.module.call_60w4rc_k$('listenWindowSizeChange', null, {
      invoke_4e155j_k$: (payload: any) => {
        const readValue = (key: 'width' | 'height') => {
          if (payload?.get_wei43m_k$) {
            return payload.get_wei43m_k$(key);
          }
          return payload?.[key] ?? null;
        };
        probe.events.push({
          width: readValue('width'),
          height: readValue('height'),
        });
      },
    });
  });
}

async function stopResizeModuleProbe(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & Record<string, any>;
    const probe = runtime.__cbWindowResizeProbe;
    if (!probe?.module) {
      throw new Error('Window resize probe is not installed');
    }
    return probe.module.call_60w4rc_k$('removeListenWindowSizeChange', null, null);
  });
}

async function readResizeProbe(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & Record<string, any>;
    return [...(runtime.__cbWindowResizeProbe?.events ?? [])];
  });
}

async function disposeResizeModuleProbe(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const runtime = globalThis as typeof globalThis & Record<string, any>;
    const probe = runtime.__cbWindowResizeProbe;
    probe?.module?.call_60w4rc_k$('removeListenWindowSizeChange', null, null);
    probe?.delegator?.onDetach_8dig02_k$?.();
    probe?.host?.remove?.();
    delete runtime.__cbWindowResizeProbe;
  });
}

test.describe('H5WindowResizeModule direct probes', () => {
  test.afterEach(async ({ kuiklyPage }) => {
    await disposeResizeModuleProbe(kuiklyPage.page);
  });

  test('direct resize probe should cover immediate debounce and timer-clear paths', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await installResizeModuleProbe(kuiklyPage.page, 'KRViewTestPage');

    expect(await startResizeModuleProbe(kuiklyPage.page)).toBe(true);

    await kuiklyPage.page.setViewportSize({ width: 391, height: 844 });
    await kuiklyPage.page.waitForTimeout(20);
    await kuiklyPage.page.setViewportSize({ width: 392, height: 844 });
    await kuiklyPage.page.waitForTimeout(20);
    await kuiklyPage.page.setViewportSize({ width: 393, height: 844 });
    await kuiklyPage.page.waitForTimeout(140);

    await kuiklyPage.page.waitForTimeout(110);
    await kuiklyPage.page.setViewportSize({ width: 394, height: 844 });
    await kuiklyPage.page.waitForTimeout(20);
    await kuiklyPage.page.setViewportSize({ width: 395, height: 844 });
    await kuiklyPage.page.waitForTimeout(90);
    await kuiklyPage.page.setViewportSize({ width: 396, height: 844 });
    await kuiklyPage.page.waitForTimeout(140);

    const widths = (await readResizeProbe(kuiklyPage.page)).map((event) => event.width);
    expect(widths).toEqual(expect.arrayContaining([391, 393, 394, 396]));
    expect(widths).not.toContain(392);
    expect(widths).not.toContain(395);
  });

  test('direct resize probe should stop callbacks after remove', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await installResizeModuleProbe(kuiklyPage.page, 'KRViewTestPage');

    expect(await startResizeModuleProbe(kuiklyPage.page)).toBe(true);

    await kuiklyPage.page.setViewportSize({ width: 401, height: 844 });
    await kuiklyPage.page.waitForTimeout(40);
    expect((await readResizeProbe(kuiklyPage.page)).map((event) => event.width)).toContain(401);

    expect(await stopResizeModuleProbe(kuiklyPage.page)).toBe(true);

    await kuiklyPage.page.setViewportSize({ width: 402, height: 844 });
    await kuiklyPage.page.waitForTimeout(160);
    const widths = (await readResizeProbe(kuiklyPage.page)).map((event) => event.width);
    expect(widths).toContain(401);
    expect(widths).not.toContain(402);
  });
});
