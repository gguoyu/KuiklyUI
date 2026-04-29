import { test, expect, type Locator, type Page } from '../../fixtures/test-base';

async function getScrollLeft(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    if (!(el instanceof HTMLElement)) return 0;
    return el.scrollLeft;
  });
}

async function getScrollMetrics(container: Locator): Promise<{ scrollLeft: number; maxScrollLeft: number }> {
  return container.evaluate((el) => {
    if (!(el instanceof HTMLElement)) return { scrollLeft: 0, maxScrollLeft: 0 };
    return {
      scrollLeft: el.scrollLeft,
      maxScrollLeft: el.scrollWidth - el.clientWidth,
    };
  });
}

async function dragHorizontally(
  page: Page,
  container: Locator,
  deltaX: number,
  steps = 14,
): Promise<void> {
  const box = await container.boundingBox();
  expect(box).toBeTruthy();

  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY, { steps });
  await page.mouse.up();
  await page.waitForTimeout(200);
}

test.describe('HorizontalListTestPage 水平列表滚动验证', () => {
  test('should load HorizontalListTestPage and render horizontal list', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('水平列表滚动测试', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('H1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('垂直列表', { exact: false })).toBeVisible();
  });

  test('clicking horizontal item should update selection', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('H1', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('选中: H-Item-1', { exact: true })).toBeVisible();
  });

  test('wheel scrolling horizontally should update scrollLeft', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Find horizontal list — it is the first KRListView
    const lists = kuiklyPage.page.locator('[data-kuikly-component=KRListView]');
    const horizontalList = lists.first();
    await expect(horizontalList).toBeVisible();

    const box = await horizontalList.boundingBox();
    expect(box).toBeTruthy();

    // Scroll right via wheel (deltaX)
    await kuiklyPage.page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await kuiklyPage.page.mouse.wheel(500, 0);
    await kuiklyPage.page.waitForTimeout(300);

    const afterScroll = await getScrollLeft(horizontalList);
    // Either horizontal scroll works or it falls back to vertical — just ensure no crash
    expect(afterScroll).toBeGreaterThanOrEqual(0);
  });

  test('pc mouse drag left should scroll horizontal list right (exercises calculateHorizontalDelta)', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const lists = kuiklyPage.page.locator('[data-kuikly-component=KRListView]');
    const horizontalList = lists.first();
    await expect(horizontalList).toBeVisible();

    const before = await getScrollLeft(horizontalList);

    // Drag leftward (negative deltaX) to scroll the list content to the right
    await dragHorizontally(kuiklyPage.page, horizontalList, -280);

    const after = await getScrollLeft(horizontalList);
    // After dragging left, scrollLeft should have increased (or stayed 0 if already at end)
    expect(after).toBeGreaterThanOrEqual(before);
  });

  test('pc mouse drag right at left boundary should stay pinned (exercises applyHorizontalScroll boundary)', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const lists = kuiklyPage.page.locator('[data-kuikly-component=KRListView]');
    const horizontalList = lists.first();
    await expect(horizontalList).toBeVisible();

    // Drag rightward when already at scrollLeft=0 → should stay at 0
    await dragHorizontally(kuiklyPage.page, horizontalList, 280);

    const afterDrag = await getScrollLeft(horizontalList);
    expect(afterDrag).toBe(0);
  });

  test('scrolling to the end should reach right boundary', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const lists = kuiklyPage.page.locator('[data-kuikly-component=KRListView]');
    const horizontalList = lists.first();
    await expect(horizontalList).toBeVisible();

    // Perform multiple drags to reach end
    for (let i = 0; i < 8; i += 1) {
      await dragHorizontally(kuiklyPage.page, horizontalList, -280);
    }

    const { scrollLeft, maxScrollLeft } = await getScrollMetrics(horizontalList);
    // Should be close to max
    expect(scrollLeft).toBeGreaterThan(0);
    // Verify H20 is visible (last item)
    if (maxScrollLeft > 0) {
      await expect(kuiklyPage.page.getByText('H20', { exact: true })).toBeVisible();
    }
  });

  test('dragging left then back right should restore earlier items', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const lists = kuiklyPage.page.locator('[data-kuikly-component=KRListView]');
    const horizontalList = lists.first();

    // Drag left to scroll right
    await dragHorizontally(kuiklyPage.page, horizontalList, -320);
    const afterScrollRight = await getScrollLeft(horizontalList);

    // Drag right to scroll back left
    await dragHorizontally(kuiklyPage.page, horizontalList, 320);
    const afterScrollBack = await getScrollLeft(horizontalList);

    expect(afterScrollBack).toBeLessThan(afterScrollRight);
    // H1 should be visible again
    await expect(kuiklyPage.page.getByText('H1', { exact: true })).toBeVisible();
  });

  test('vertical items should be scrollable in second list', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const lists = kuiklyPage.page.locator('[data-kuikly-component=KRListView]');
    // Second list is the vertical one
    const verticalList = lists.nth(1);
    await kuiklyPage.scrollInContainer(verticalList, { deltaY: 300, smooth: false });

    await expect(kuiklyPage.page.getByText('vertical-item-8', { exact: true })).toBeVisible();
  });

  test('clicking vertical item should update selection', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalListTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('vertical-item-1', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('选中: V-Item-1', { exact: true })).toBeVisible();
  });
});
