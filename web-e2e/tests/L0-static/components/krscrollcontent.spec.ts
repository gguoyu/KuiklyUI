import { test, expect, type Locator } from '../../../fixtures/test-base';

async function getScrollTop(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    if (!(el instanceof HTMLElement)) {
      return 0;
    }
    return el.scrollTop;
  });
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
});
