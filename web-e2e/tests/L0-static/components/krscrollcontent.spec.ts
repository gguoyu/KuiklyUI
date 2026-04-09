import { test, expect, type Locator } from '../../../fixtures/test-base';

async function getScrollTop(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    if (!(el instanceof HTMLElement)) {
      return 0;
    }
    return el.scrollTop;
  });
}

test.describe('KRScrollContentView 娓叉煋娴嬭瘯', () => {
  test('搴旇鎴愬姛鍔犺浇 KRScrollContentViewTestPage 椤甸潰', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 鍨傜洿婊氬姩')).toBeVisible();
  });

  test('搴旇姝ｇ‘娓叉煋婊氬姩瀹瑰櫒缁勪欢', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const scrollContentViews = await kuiklyPage.components('KRScrollContentView');

    expect(scrollViews.length + scrollContentViews.length).toBeGreaterThan(0);
  });

  test('搴旇姝ｇ‘娓叉煋鍨傜洿婊氬姩鍐呭', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('鍨傜洿椤?1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('鍨傜洿椤?2', { exact: true })).toBeVisible();
  });

  test('搴旇姝ｇ‘娓叉煋姘村钩婊氬姩鍐呭', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=2. 姘村钩婊氬姩')).toBeVisible();
    await expect(kuiklyPage.page.getByText('H1', { exact: true })).toBeVisible();
  });

  test('搴旇姝ｇ‘娓叉煋宓屽甯冨眬', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=5. 宓屽甯冨眬楠岃瘉')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=宸︿晶婊氬姩')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=鍙充晶婊氬姩')).toBeVisible();
  });

  test('瑙嗚鍥炲綊锛欿RScrollContentViewTestPage 鎴浘瀵规瘮', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('krscrollcontent-test.png', {
      maxDiffPixels: 200,
    });
  });

  test('scrolling the first container should expose deeper vertical items', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const verticalScroller = scrollViews[0];
    expect(verticalScroller).toBeTruthy();

    await kuiklyPage.scrollInContainer(verticalScroller, { deltaY: 480, smooth: false });
    await expect(kuiklyPage.page.getByText('鍨傜洿椤?9', { exact: true })).toBeVisible();
  });

  test('scrolling the row container should reveal later horizontal tiles', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const horizontalScroller = scrollViews[1];
    expect(horizontalScroller).toBeTruthy();

    await kuiklyPage.scrollInContainer(horizontalScroller, { deltaX: 720, smooth: false });
    await expect(kuiklyPage.page.getByText('H12', { exact: true })).toBeVisible();
  });

  test('nested left and right columns should stay independently scrollable', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const leftNestedScroller = scrollViews[4];
    const rightNestedScroller = scrollViews[5];

    expect(leftNestedScroller).toBeTruthy();
    expect(rightNestedScroller).toBeTruthy();

    await kuiklyPage.scrollInContainer(leftNestedScroller, { deltaY: 180, smooth: false });
    await kuiklyPage.scrollInContainer(rightNestedScroller, { deltaY: 180, smooth: false });

    await expect(kuiklyPage.page.getByText('L8', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('R8', { exact: true })).toBeVisible();
  });

  test('nested columns should retain independent offsets after sequential scrolling', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const leftNestedScroller = scrollViews[4];
    const rightNestedScroller = scrollViews[5];

    await kuiklyPage.scrollInContainer(leftNestedScroller, { deltaY: 180, smooth: false });
    const leftAfterFirstScroll = await getScrollTop(leftNestedScroller);

    await kuiklyPage.scrollInContainer(rightNestedScroller, { deltaY: 180, smooth: false });
    const rightAfterScroll = await getScrollTop(rightNestedScroller);
    const leftAfterRightScroll = await getScrollTop(leftNestedScroller);

    expect(leftAfterFirstScroll).toBeGreaterThan(0);
    expect(rightAfterScroll).toBeGreaterThan(0);
    expect(leftAfterRightScroll).toBe(leftAfterFirstScroll);
  });
});
