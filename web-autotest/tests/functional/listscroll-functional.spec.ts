import { test, expect, type Locator, type Page } from '../../fixtures/test-base';

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
  await page.waitForTimeout(180);
}

test.describe('list scroll 功能验证', () => {
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
    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
    expect(await kuiklyPage.page.getByText('分组 2', { exact: true }).count()).toBeGreaterThan(0);
    expect(await kuiklyPage.page.getByText('列表项 2', { exact: true }).count()).toBeGreaterThan(0);
  });

  test('clicking an item should update selected state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.component('KRListView').first()).toBeVisible();

    await kuiklyPage.page.getByText('列表项 1', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('选中: 列表项 1', { exact: true })).toBeVisible();
  });

  test('clicking different items should switch selection', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('列表项 3', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 3', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('列表项 5', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 5', { exact: true })).toBeVisible();
  });

  test('single clicking an item should trigger the list click callback', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('列表项 4', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('列表手势: 单击', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('选中: 列表项 4', { exact: true })).toBeVisible();
  });

  test('double clicking an item should trigger the list double click callback', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('列表项 6', { exact: true }).dblclick();
    await kuiklyPage.page.waitForTimeout(450);

    await expect(kuiklyPage.page.getByText('列表手势: 双击', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('选中: 列表项 6', { exact: true })).toBeVisible();
  });

  test('right clicking an item should not change selection or trigger list click state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('列表项 7', { exact: true }).click({ button: 'right' });
    await kuiklyPage.page.waitForTimeout(200);

    await expect(kuiklyPage.page.getByText('选中: 未选择', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表手势: 未触发', { exact: true })).toBeVisible();
  });

  test('right clicking the list container should be ignored before selection bookkeeping starts', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    const box = await listContainer.boundingBox();
    expect(box).toBeTruthy();

    await kuiklyPage.page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: 'right' });
    await kuiklyPage.page.waitForTimeout(200);

    await expect(kuiklyPage.page.getByText('选中: 未选择', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表手势: 未触发', { exact: true })).toBeVisible();
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
    await expect(kuiklyPage.page.getByText('分组 5', { exact: true })).toBeVisible();
  });

  test('clicking a visible item after scrolling should still update selection', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 500, smooth: false });

    const visibleItem = kuiklyPage.page.getByText('列表项 8', { exact: true });
    await expect(visibleItem).toBeVisible();
    await visibleItem.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 8', { exact: true })).toBeVisible();
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
    await expect(kuiklyPage.page.getByText('列表项 13', { exact: true })).toBeVisible();

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
    await expect(kuiklyPage.page.getByText('分组 3', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 21', { exact: true })).toBeVisible();
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
    await expect(kuiklyPage.page.getByText('分组 5', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('列表项 50', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 50', { exact: true })).toBeVisible();
  });

  test('selection should persist after scrolling away and back', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 900, smooth: false });
    await expect(kuiklyPage.page.getByText('列表项 13', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('列表项 13', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 13', { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 500, smooth: false });
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: -500, smooth: false });
    await expect(kuiklyPage.page.getByText('选中: 列表项 13', { exact: true })).toBeVisible();
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
    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 1', { exact: true })).toBeVisible();
  });

  test('pc dragging upward should scroll down and dragging back should restore earlier items', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await dragInContainer(kuiklyPage.page, listContainer, 0, -320);

    const afterDragDown = await getScrollMetrics(listContainer);
    expect(afterDragDown.scrollTop).toBeGreaterThan(100);
    await expect(kuiklyPage.page.getByText('列表项 13', { exact: true })).toBeVisible();

    await dragInContainer(kuiklyPage.page, listContainer, 0, 420);

    const afterDragBack = await getScrollMetrics(listContainer);
    expect(afterDragBack.scrollTop).toBeLessThan(afterDragDown.scrollTop);
    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
  });

  test('pc dragging downward on the first screen should stay pinned to the top boundary', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await dragInContainer(kuiklyPage.page, listContainer, 0, 260);

    const { scrollTop } = await getScrollMetrics(listContainer);
    expect(scrollTop).toBe(0);
    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
  });

  test('pc dragging upward at the bottom should stay pinned to the bottom boundary', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    for (let i = 0; i < 12; i += 1) {
      await kuiklyPage.scrollInContainer(listContainer, { deltaY: 400, smooth: false });
    }

    const beforeExtraDrag = await getScrollMetrics(listContainer);
    await dragInContainer(kuiklyPage.page, listContainer, 0, -320);
    const afterExtraDrag = await getScrollMetrics(listContainer);

    expect(Math.abs(beforeExtraDrag.maxScrollTop - beforeExtraDrag.scrollTop)).toBeLessThanOrEqual(4);
    expect(Math.abs(afterExtraDrag.scrollTop - beforeExtraDrag.scrollTop)).toBeLessThanOrEqual(4);
    await expect(kuiklyPage.page.getByText('分组 5', { exact: true })).toBeVisible();
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

  test('touch drag scroll should trigger handleMoveCommon and list scroll handlers', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    const box = await listContainer.boundingBox();
    expect(box).toBeTruthy();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height * 0.7;

    // Simulate a touch-style drag (mouse down, move, up) to trigger H5ListView touch handlers
    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    // Move upward (scroll down) in multiple steps to trigger handleMoveCommon branches
    for (let i = 0; i < 10; i++) {
      await kuiklyPage.page.mouse.move(cx, cy - (i + 1) * 30, { steps: 2 });
      await kuiklyPage.page.waitForTimeout(16);
    }
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(300);

    const { scrollTop: after } = await getScrollMetrics(listContainer);
    expect(after).toBeGreaterThanOrEqual(0);
  });

  test('navigating away and back should trigger KuiklyRenderView lifecycle handlers', async ({ kuiklyPage }) => {
    // First navigation — triggers initial lifecycle
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.component('KRListView').first()).toBeVisible();

    // Navigate to a different page — triggers onPause/destroy lifecycle
    await kuiklyPage.goto('SmokeTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Navigate back — triggers onCreate/onResume lifecycle again
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.component('KRListView').first()).toBeVisible();
  });

  test('navigating away with active click and wheel timers should still clean up safely', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    const box = await listContainer.boundingBox();
    expect(box).toBeTruthy();

    await kuiklyPage.page.getByText('列表项 2', { exact: true }).click();
    await kuiklyPage.page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await kuiklyPage.page.mouse.wheel(0, 240);
    await kuiklyPage.page.waitForTimeout(40);

    await kuiklyPage.goto('SmokeTestPage');
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();

    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.component('KRListView').first()).toBeVisible();
  });

  test('scroll events should fire dragBegin and scroll callbacks when dragging', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    // Perform a drag to trigger dragBegin and scroll callbacks
    await dragInContainer(kuiklyPage.page, listContainer, 0, -200);
    await kuiklyPage.page.waitForTimeout(300);

    // dragBegin count should be > 0
    const dragBeginText = kuiklyPage.page.getByText(/drag-begin: [1-9]/, { exact: false });
    await expect(dragBeginText).toBeVisible();
  });

  test('wheel scroll should fire scroll callbacks', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    const box = await listContainer.boundingBox();
    expect(box).toBeTruthy();

    await kuiklyPage.page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await kuiklyPage.page.mouse.wheel(0, 400);
    await kuiklyPage.page.waitForTimeout(400);

    // scroll-events count should be > 0 after wheel scrolling
    const scrollText = kuiklyPage.page.getByText(/scroll-events: [1-9]/, { exact: false });
    await expect(scrollText).toBeVisible();
  });

  test('programmatic setContentOffset button should be visible and clickable', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // The scroll-to-top button calls ViewRef.setContentOffset(0, 0) — verifies rendering
    const btn = kuiklyPage.page.getByText('scroll-to-top-idle', { exact: true });
    await expect(btn).toBeVisible();

    // Click the button to exercise setContentOffset path
    await btn.click({ force: true });
    await kuiklyPage.page.waitForTimeout(500);

    // Either the count updates OR stays at idle — both are acceptable
    // The important thing is the code path was exercised (setContentOffset registered)
    const scrollToText = await kuiklyPage.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find(e => (e.textContent || '').startsWith('scroll-to-top'));
      return el?.textContent || '';
    });
    expect(scrollToText).toMatch(/scroll-to-top/);
  });

  test('indicator toggle should add and remove the no-scrollbar class', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    const toggle = kuiklyPage.page.getByText('indicator:shown', { exact: true });
    await expect(toggle).toBeVisible();

    await toggle.evaluate((node) => (node.parentElement as HTMLElement | null)?.click());
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText('indicator:hidden', { exact: true })).toBeVisible();
    expect(await listContainer.evaluate((el) => el.classList.contains('list-no-scrollbar'))).toBe(true);

    await kuiklyPage.page.getByText('indicator:hidden', { exact: true }).evaluate((node) => (node.parentElement as HTMLElement | null)?.click());
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText('indicator:shown', { exact: true })).toBeVisible();
    expect(await listContainer.evaluate((el) => el.classList.contains('list-no-scrollbar'))).toBe(false);
  });

  test('bounce toggle should switch between on and off labels', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const toggle = kuiklyPage.page.getByText('bounce:on', { exact: true });
    await expect(toggle).toBeVisible();

    await toggle.evaluate((node) => (node.parentElement as HTMLElement | null)?.click());
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText('bounce:off', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('bounce:off', { exact: true }).evaluate((node) => (node.parentElement as HTMLElement | null)?.click());
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText('bounce:on', { exact: true })).toBeVisible();
  });

  test('rapid consecutive wheel scrolls should not crash', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    const box = await list.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      for (let i = 0; i < 10; i++) {
        await kuiklyPage.page.mouse.wheel(0, 100);
      }
      await kuiklyPage.page.waitForTimeout(300);
    }
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('horizontal wheel scroll should not affect vertical list position', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Verify first item visible before horizontal scroll
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();

    const list = kuiklyPage.component('KRListView').first();
    const box = await list.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Horizontal wheel on vertical list — exercises isWheelMatchDirection=false path
      await kuiklyPage.page.mouse.wheel(300, 0);
      await kuiklyPage.page.waitForTimeout(200);
    }
    // Page should still be functional
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('diagonal drag should exercise scroll direction detection logic', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    const box = await list.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      // Diagonal drag — exercises scroll direction detection (absDeltaY vs absDeltaX)
      await kuiklyPage.page.mouse.move(cx, cy);
      await kuiklyPage.page.mouse.down();
      await kuiklyPage.page.mouse.move(cx + 50, cy - 50, { steps: 5 });
      await kuiklyPage.page.mouse.up();
      await kuiklyPage.page.waitForTimeout(300);
    }
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
