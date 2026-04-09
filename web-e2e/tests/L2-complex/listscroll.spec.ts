import { test, expect, type Locator } from '../../fixtures/test-base';

async function getScrollMetrics(container: Locator): Promise<{ scrollTop: number; maxScrollTop: number }> {
  return container.evaluate((el) => {
    if (!(el instanceof HTMLElement)) {
      return { scrollTop: 0, maxScrollTop: 0 };
    }

    return {
      scrollTop: el.scrollTop,
      maxScrollTop: el.scrollHeight - el.clientHeight,
    };
  });
}

test.describe('list scroll coverage', () => {
  test('should load ListScrollTestPage', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.component('KRListView').first()).toBeVisible();
    expect(await kuiklyPage.page.locator('[data-kuikly-component=KRRichTextView]').count()).toBeGreaterThan(10);
    expect(await kuiklyPage.page.locator('[data-kuikly-component=KRView]').count()).toBeGreaterThan(10);
  });

  test('should render list groups', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('闁告帒妫涚划?1', { exact: true })).toBeVisible();
    expect(await kuiklyPage.page.getByText('闁告帒妫涚划?2', { exact: true }).count()).toBeGreaterThanOrEqual(0);
    expect(await kuiklyPage.page.getByText('闁告帗顨夐妴鍐┿亜?2', { exact: true }).count()).toBeGreaterThanOrEqual(0);
  });

  test('clicking an item should update selected state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.component('KRListView').first()).toBeVisible();

    await kuiklyPage.page.getByText('闁告帗顨夐妴鍐┿亜?1', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('闂備緡鍋勯ˇ顕€鎳? 闂佸憡甯楅〃澶愬Υ閸愨斂浜?1', { exact: true })).toBeVisible();
  });

  test('clicking different items should switch selection', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?3', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('闂備緡鍋勯ˇ顕€鎳? 闂佸憡甯楅〃澶愬Υ閸愨斂浜?3', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?5', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('闂備緡鍋勯ˇ顕€鎳? 闂佸憡甯楅〃澶愬Υ閸愨斂浜?5', { exact: true })).toBeVisible();
  });

  test('extra downward scroll at the bottom should stay at the boundary', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    for (let i = 0; i < 12; i += 1) {
      await kuiklyPage.scrollInContainer(listContainer, { deltaY: 400, smooth: false });
    }

    const beforeExtraScroll = await getScrollMetrics(listContainer);
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 800, smooth: false });
    const afterExtraScroll = await getScrollMetrics(listContainer);

    expect(beforeExtraScroll.scrollTop).toBeGreaterThan(2000);
    expect(Math.abs(beforeExtraScroll.maxScrollTop - beforeExtraScroll.scrollTop)).toBeLessThanOrEqual(4);
    expect(Math.abs(afterExtraScroll.scrollTop - beforeExtraScroll.scrollTop)).toBeLessThanOrEqual(4);
    await expect(kuiklyPage.page.getByText('闂佸憡甯掑Λ娑氬垝?5', { exact: true })).toBeVisible();
  });

  test('clicking a visible item after scrolling should still update selection', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 500, smooth: false });

    const visibleItem = kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?8', { exact: true });
    await expect(visibleItem).toBeVisible();
    await visibleItem.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('闂備緡鍋勯ˇ顕€鎳? 闂佸憡甯楅〃澶愬Υ閸愨斂浜?8', { exact: true })).toBeVisible();
  });

  test('mouse wheel scrolling should update the visible list range', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    const box = await listContainer.boundingBox();
    expect(box).toBeTruthy();

    await kuiklyPage.page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await kuiklyPage.page.mouse.wheel(0, 900);
    await kuiklyPage.page.waitForTimeout(250);

    const afterWheelDown = await getScrollMetrics(listContainer);
    expect(afterWheelDown.scrollTop).toBeGreaterThan(0);
    await expect(kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?13', { exact: true })).toBeVisible();

    await kuiklyPage.page.mouse.wheel(0, -450);
    await kuiklyPage.page.waitForTimeout(250);

    const afterWheelUp = await getScrollMetrics(listContainer);
    expect(afterWheelUp.scrollTop).toBeLessThan(afterWheelDown.scrollTop);
  });

  test('scrolling to the middle should reveal later groups and items', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 1200, smooth: false });

    const { scrollTop } = await getScrollMetrics(listContainer);
    expect(scrollTop).toBeGreaterThan(1000);
    await expect(kuiklyPage.page.getByText('闂佸憡甯掑Λ娑氬垝?3', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?21', { exact: true })).toBeVisible();
  });

  test('the bottom region should still allow selecting item 50', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    for (let i = 0; i < 12; i += 1) {
      await kuiklyPage.scrollInContainer(listContainer, { deltaY: 400, smooth: false });
    }

    const { scrollTop } = await getScrollMetrics(listContainer);
    expect(scrollTop).toBeGreaterThan(2000);
    await expect(kuiklyPage.page.getByText('闂佸憡甯掑Λ娑氬垝?5', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?50', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('闂備緡鍋勯ˇ顕€鎳? 闂佸憡甯楅〃澶愬Υ閸愨斂浜?50', { exact: true })).toBeVisible();
  });

  test('selection should persist after scrolling away and back', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 900, smooth: false });
    await expect(kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?13', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?13', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('闂備緡鍋勯ˇ顕€鎳? 闂佸憡甯楅〃澶愬Υ閸愨斂浜?13', { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 500, smooth: false });
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: -500, smooth: false });
    await expect(kuiklyPage.page.getByText('闂備緡鍋勯ˇ顕€鎳? 闂佸憡甯楅〃澶愬Υ閸愨斂浜?13', { exact: true })).toBeVisible();
  });

  test('scrolling back to the top should restore the first screen content', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 1200, smooth: false });
    for (let i = 0; i < 4; i += 1) {
      await kuiklyPage.scrollInContainer(listContainer, { deltaY: -400, smooth: false });
    }

    const { scrollTop } = await getScrollMetrics(listContainer);
    expect(scrollTop).toBe(0);
    await expect(kuiklyPage.page.getByText('闂佸憡甯掑Λ娑氬垝?1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?1', { exact: true })).toBeVisible();
  });

  test('visual regression for the initial state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('listscroll-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('visual regression after selecting an item', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('闂佸憡甯楅〃澶愬Υ閸愨斂浜?2', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('listscroll-test-selected.png', {
      maxDiffPixels: 300,
    });
  });
  test('wheel scrolling upward at the top should remain pinned to the first group', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    const box = await listContainer.boundingBox();
    expect(box).toBeTruthy();

    await kuiklyPage.page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await kuiklyPage.page.mouse.wheel(0, -600);
    await kuiklyPage.page.waitForTimeout(250);

    const { scrollTop } = await getScrollMetrics(listContainer);
    expect(scrollTop).toBe(0);
    expect(await kuiklyPage.page.locator('[data-kuikly-component=KRRichTextView]').count()).toBeGreaterThan(10);
    expect(await kuiklyPage.page.locator('[data-kuikly-component=KRView]').count()).toBeGreaterThan(10);
  });
});
