import { test, expect, type Locator, type Page } from '../../../fixtures/test-base';

async function getScrollTop(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    if (!(el instanceof HTMLElement)) {
      return 0;
    }
    return el.scrollTop;
  });
}

async function dragInContainer(
  page: Page,
  container: Locator,
  deltaX: number,
  deltaY: number,
  steps = 14,
): Promise<void> {
  const box = await container.boundingBox();
  expect(box).toBeTruthy();

  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps });
  await page.mouse.up();
  await page.waitForTimeout(220);
}

async function installCoarsePointerMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const createMediaQueryList = (matches: boolean, media: string) => ({
      matches,
      media,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    });

    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query === '(pointer: coarse)') {
        return createMediaQueryList(true, query) as MediaQueryList;
      }
      if (query === '(pointer: fine)') {
        return createMediaQueryList(false, query) as MediaQueryList;
      }
      return originalMatchMedia(query);
    };
  });
}

async function touchDragInContainer(
  page: Page,
  container: Locator,
  deltaX: number,
  deltaY: number,
  steps = 8,
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
  });

  await container.scrollIntoViewIfNeeded();
  const box = await container.boundingBox();
  expect(box).toBeTruthy();

  const startX = Math.round(box!.x + box!.width / 2);
  const startY = Math.round(box!.y + box!.height / 2);

  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, radiusX: 5, radiusY: 5, force: 1, id: 1 }],
  });

  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: Math.round(startX + deltaX * progress),
        y: Math.round(startY + deltaY * progress),
        radiusX: 5,
        radiusY: 5,
        force: 1,
        id: 1,
      }],
    });
  }

  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await page.waitForTimeout(220);
}

test.describe('KRScrollContentView 滚动内容测试', () => {
  test('应该成功加载 KRScrollContentViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 垂直滚动')).toBeVisible();
  });

  test('应该正确渲染滚动容器组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const scrollContentViews = await kuiklyPage.components('KRScrollContentView');

    expect(scrollViews.length + scrollContentViews.length).toBeGreaterThan(0);
  });

  test('应该正确渲染垂直滚动内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('垂直项 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('垂直项 2', { exact: true })).toBeVisible();
  });

  test('应该正确渲染水平滚动内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=2. 水平滚动')).toBeVisible();
    await expect(kuiklyPage.page.getByText('H1', { exact: true })).toBeVisible();
  });

  test('应该正确渲染嵌套布局', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=5. 嵌套布局验证')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=左侧滚动')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=右侧滚动')).toBeVisible();
  });

  test('视觉回归：KRScrollContentViewTestPage 截图对比', async ({ kuiklyPage }) => {
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
    await expect(kuiklyPage.page.getByText('垂直项 9', { exact: true })).toBeVisible();
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

  test('mouse dragging upward in the self-first nested column should scroll its own content once visible', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const leftNestedScroller = scrollViews[4];

    await leftNestedScroller.scrollIntoViewIfNeeded();
    await dragInContainer(kuiklyPage.page, leftNestedScroller, 0, -180);

    const leftAfterSelfDrag = await getScrollTop(leftNestedScroller);
    expect(leftAfterSelfDrag).toBeGreaterThan(0);
    await expect(kuiklyPage.page.getByText('L8', { exact: true })).toBeVisible();
  });

  test('dragging downward at the top of the self-first nested column should stay pinned to the top boundary', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const leftNestedScroller = scrollViews[4];

    await leftNestedScroller.scrollIntoViewIfNeeded();
    await dragInContainer(kuiklyPage.page, leftNestedScroller, 0, 180);

    const leftAfterBoundaryDrag = await getScrollTop(leftNestedScroller);
    expect(leftAfterBoundaryDrag).toBe(0);
    await expect(kuiklyPage.page.getByText('L1', { exact: true })).toBeVisible();
  });

  test('mouse dragging the parent-first nested column should remain pinned until parent handoff', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const leftNestedScroller = scrollViews[4];
    const rightNestedScroller = scrollViews[5];

    await rightNestedScroller.scrollIntoViewIfNeeded();
    await dragInContainer(kuiklyPage.page, rightNestedScroller, 0, -180);

    const rightAfterDrag = await getScrollTop(rightNestedScroller);
    const leftAfterRightDrag = await getScrollTop(leftNestedScroller);

    expect(rightAfterDrag).toBe(0);
    expect(leftAfterRightDrag).toBe(0);
    await expect(kuiklyPage.page.getByText('R1', { exact: true })).toBeVisible();
  });

  test('touch dragging upward in the self-first nested column should scroll in coarse pointer mode', async ({ kuiklyPage }) => {
    await installCoarsePointerMode(kuiklyPage.page);
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const leftNestedScroller = scrollViews[4];

    await touchDragInContainer(kuiklyPage.page, leftNestedScroller, 0, -180);

    const leftAfterTouchDrag = await getScrollTop(leftNestedScroller);
    expect(leftAfterTouchDrag).toBeGreaterThan(0);
    await expect(kuiklyPage.page.getByText('L8', { exact: true })).toBeVisible();
  });

  test('touch dragging downward at the top of the self-first nested column should stay pinned in coarse pointer mode', async ({ kuiklyPage }) => {
    await installCoarsePointerMode(kuiklyPage.page);
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollViews = await kuiklyPage.components('KRScrollView');
    const leftNestedScroller = scrollViews[4];

    await touchDragInContainer(kuiklyPage.page, leftNestedScroller, 0, 180);

    const leftAfterTouchBoundaryDrag = await getScrollTop(leftNestedScroller);
    expect(leftAfterTouchBoundaryDrag).toBe(0);
    await expect(kuiklyPage.page.getByText('L1', { exact: true })).toBeVisible();
  });
});
