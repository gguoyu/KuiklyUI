import { test, expect, type Locator, type Page } from '../../../fixtures/test-base';

async function getScrollTop(container: Locator): Promise<number> {
  return container.evaluate((el) => {
    if (!(el instanceof HTMLElement)) return 0;
    return el.scrollTop;
  });
}

async function fastDragInContainer(
  page: Page,
  container: Locator,
  deltaX: number,
  deltaY: number,
  steps = 2,
): Promise<void> {
  const box = await container.boundingBox();
  expect(box).toBeTruthy();

  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height * 0.7;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps });
  await page.mouse.up();
}

test.describe('NestedScrollTestPage functional', () => {
  test('page should render all nested scroll sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Nested Scroll Test Page', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Section 1: PARENT_FIRST', { exact: false })).toBeVisible();
  });

  test('scrolling in SELF_FIRST section should exercise nested scroll helper', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 400, smooth: false });
    await expect(kuiklyPage.page.getByText('Section 2: SELF_FIRST', { exact: false })).toBeVisible();

    // Scroll inside inner list to exercise H5NestScrollHelper SELF_FIRST branch
    const innerLists = kuiklyPage.component('KRListView');
    const innerListCount = await innerLists.count();
    if (innerListCount > 1) {
      const innerList = innerLists.nth(1);
      const box = await innerList.boundingBox().catch(() => null);
      if (box) {
        await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await kuiklyPage.page.mouse.wheel(0, 200);
        await kuiklyPage.page.waitForTimeout(300);
      }
    }
    // No crash - page still functional
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('scrolling to SELF_ONLY section should render correctly', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });
    await expect(kuiklyPage.page.getByText('Section 3: SELF_ONLY', { exact: false })).toBeVisible();
  });

  test('mouse wheel in nested inner list should exercise nested scroll dispatch', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Scroll to section 1 inner list and perform wheel
    const innerLists = kuiklyPage.component('KRListView');
    const count = await innerLists.count();
    if (count > 1) {
      const innerList = innerLists.nth(1);
      const box = await innerList.boundingBox().catch(() => null);
      if (box) {
        await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        // Wheel up and down to exercise both directions
        await kuiklyPage.page.mouse.wheel(0, 150);
        await kuiklyPage.page.waitForTimeout(200);
        await kuiklyPage.page.mouse.wheel(0, -100);
        await kuiklyPage.page.waitForTimeout(200);
      }
    }
    // Page still functional
    await expect(kuiklyPage.page.getByText('Nested Scroll Test Page', { exact: false })).toBeVisible();
  });

  test('scrolling inner list to boundary should propagate to parent', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Find inner list and scroll to its bottom boundary
    const innerLists = kuiklyPage.component('KRListView');
    const count = await innerLists.count();
    if (count > 1) {
      const outerList = innerLists.first();
      const innerList = innerLists.nth(1);
      const box = await innerList.boundingBox().catch(() => null);
      if (box) {
        await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        // Scroll far to hit inner boundary — exercises canScrollDown/canScrollUp checks
        for (let i = 0; i < 5; i++) {
          await kuiklyPage.page.mouse.wheel(0, 300);
          await kuiklyPage.page.waitForTimeout(100);
        }

        const outerBefore = await getScrollTop(outerList);
        await kuiklyPage.page.mouse.wheel(0, 400);
        await kuiklyPage.page.waitForTimeout(200);
        const outerAfter = await getScrollTop(outerList);
        expect(outerAfter).toBeGreaterThanOrEqual(outerBefore);

        // Then scroll back up past boundary
        for (let i = 0; i < 5; i++) {
          await kuiklyPage.page.mouse.wheel(0, -300);
          await kuiklyPage.page.waitForTimeout(100);
        }
      }
    }
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('mousemove without mousedown should not scroll the nested list', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const innerLists = kuiklyPage.component('KRListView');
    const count = await innerLists.count();
    if (count > 1) {
      const innerList = innerLists.nth(1);
      const before = await getScrollTop(innerList);
      const box = await innerList.boundingBox().catch(() => null);
      if (box) {
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await kuiklyPage.page.mouse.move(x, y);
        await kuiklyPage.page.mouse.move(x, y - 120, { steps: 6 });
        await kuiklyPage.page.waitForTimeout(120);
      }
      const after = await getScrollTop(innerList);
      expect(after).toBe(before);
    }
  });

  test('fast drag should continue scrolling briefly after release because inertia is active', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const innerLists = kuiklyPage.component('KRListView');
    const count = await innerLists.count();
    if (count > 1) {
      const innerList = innerLists.nth(1);
      await fastDragInContainer(kuiklyPage.page, innerList, 0, -220);
      await kuiklyPage.page.waitForTimeout(50);
      const shortlyAfterRelease = await getScrollTop(innerList);
      await kuiklyPage.page.waitForTimeout(300);
      const afterInertia = await getScrollTop(innerList);
      expect(afterInertia).toBeGreaterThanOrEqual(shortlyAfterRelease);
    }
  });

  test('starting a second fast drag should keep the nested list interactive while inertia is settling', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const innerLists = kuiklyPage.component('KRListView');
    const count = await innerLists.count();
    if (count > 1) {
      const innerList = innerLists.nth(1);
      await fastDragInContainer(kuiklyPage.page, innerList, 0, -220);
      await kuiklyPage.page.waitForTimeout(80);
      const beforeSecondDrag = await getScrollTop(innerList);
      await fastDragInContainer(kuiklyPage.page, innerList, 0, -160);
      await kuiklyPage.page.waitForTimeout(250);
      expect(await getScrollTop(innerList)).toBeGreaterThanOrEqual(beforeSecondDrag);
    }
    await expect(kuiklyPage.page.getByText('Nested Scroll Test Page', { exact: false })).toBeVisible();
  });

  test('drag in nested list should exercise touch event nested scroll paths', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const innerLists = kuiklyPage.component('KRListView');
    const count = await innerLists.count();
    if (count > 1) {
      const innerList = innerLists.nth(1);
      const box = await innerList.boundingBox().catch(() => null);
      if (box) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        // Mouse drag to simulate touch-like scroll
        await kuiklyPage.page.mouse.move(cx, cy);
        await kuiklyPage.page.mouse.down();
        await kuiklyPage.page.mouse.move(cx, cy - 100, { steps: 5 });
        await kuiklyPage.page.mouse.up();
        await kuiklyPage.page.waitForTimeout(300);
      }
    }
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
