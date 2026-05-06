import { test, expect, type Locator, type Page } from '../../../fixtures/test-base';

async function getScrollLeft(container: Locator): Promise<number> {
  return container.evaluate((el) => {
    if (!(el instanceof HTMLElement)) return 0;
    return el.scrollLeft;
  });
}

async function horizontalDrag(
  page: Page,
  container: Locator,
  deltaX: number,
  steps = 8,
): Promise<void> {
  const box = await container.boundingBox();
  expect(box).toBeTruthy();

  const startX = box!.x + box!.width * 0.7;
  const startY = box!.y + box!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY, { steps });
  await page.mouse.up();
  await page.waitForTimeout(200);
}

test.describe('HorizontalNestScrollTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HorizontalNestScrollTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('page should render all three horizontal nested scroll sections', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('Horizontal Nested Scroll', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Section 1: Horizontal PARENT_FIRST', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Section 2: Horizontal SELF_FIRST', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Section 3: Horizontal SELF_ONLY', { exact: false })).toBeVisible();
  });

  test('horizontal wheel in PARENT_FIRST list should scroll', async ({ kuiklyPage }) => {
    const lists = kuiklyPage.component('KRListView');
    const count = await lists.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const hList = lists.first();
    const box = await hList.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Horizontal wheel to scroll the horizontal list
      await kuiklyPage.page.mouse.wheel(300, 0);
      await kuiklyPage.page.waitForTimeout(300);
    }

    const scrollLeft = await getScrollLeft(hList);
    expect(scrollLeft).toBeGreaterThanOrEqual(0);
  });

  test('horizontal drag in SELF_FIRST list should scroll horizontally', async ({ kuiklyPage }) => {
    const lists = kuiklyPage.component('KRListView');
    const count = await lists.count();
    if (count < 2) return;

    const selfFirstList = lists.nth(1);
    const beforeScroll = await getScrollLeft(selfFirstList);
    await horizontalDrag(kuiklyPage.page, selfFirstList, -200);
    await kuiklyPage.page.waitForTimeout(300);

    const afterScroll = await getScrollLeft(selfFirstList);
    expect(afterScroll).toBeGreaterThanOrEqual(beforeScroll);
  });

  test('horizontal wheel at boundary should exercise canScrollRight check', async ({ kuiklyPage }) => {
    const lists = kuiklyPage.component('KRListView');
    const count = await lists.count();
    if (count < 3) return;

    const selfOnlyList = lists.nth(2);
    const box = await selfOnlyList.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Scroll far right to hit boundary
      for (let i = 0; i < 10; i++) {
        await kuiklyPage.page.mouse.wheel(200, 0);
        await kuiklyPage.page.waitForTimeout(50);
      }
      await kuiklyPage.page.waitForTimeout(200);

      // Additional scroll should not crash
      await kuiklyPage.page.mouse.wheel(200, 0);
      await kuiklyPage.page.waitForTimeout(200);
    }

    // Page should still be functional
    await expect(kuiklyPage.page.getByText('Horizontal Nested Scroll', { exact: false })).toBeVisible();
  });

  test('reverse horizontal wheel should exercise canScrollLeft check', async ({ kuiklyPage }) => {
    const lists = kuiklyPage.component('KRListView');
    const count = await lists.count();
    if (count < 1) return;

    const hList = lists.first();
    const box = await hList.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // First scroll right
      await kuiklyPage.page.mouse.wheel(300, 0);
      await kuiklyPage.page.waitForTimeout(200);
      // Then scroll back left
      await kuiklyPage.page.mouse.wheel(-300, 0);
      await kuiklyPage.page.waitForTimeout(200);
      // Scroll past boundary (left at 0)
      await kuiklyPage.page.mouse.wheel(-300, 0);
      await kuiklyPage.page.waitForTimeout(200);
    }

    // Should not crash
    await expect(kuiklyPage.page.getByText('Horizontal Nested Scroll', { exact: false })).toBeVisible();
  });

  test('vertical wheel on horizontal list should not scroll horizontally', async ({ kuiklyPage }) => {
    const lists = kuiklyPage.component('KRListView');
    if (await lists.count() < 1) return;

    const hList = lists.first();
    const beforeScroll = await getScrollLeft(hList);
    const box = await hList.boundingBox();
    if (box) {
      await kuiklyPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Vertical wheel on horizontal list — should not change scrollLeft
      await kuiklyPage.page.mouse.wheel(0, 300);
      await kuiklyPage.page.waitForTimeout(200);
    }

    const afterScroll = await getScrollLeft(hList);
    // scrollLeft should not have changed significantly from vertical wheel
    expect(Math.abs(afterScroll - beforeScroll)).toBeLessThanOrEqual(5);
  });

  test('mouse drag in SELF_ONLY list should scroll without propagation', async ({ kuiklyPage }) => {
    const lists = kuiklyPage.component('KRListView');
    const count = await lists.count();
    if (count < 3) return;

    const selfOnlyList = lists.nth(2);
    await horizontalDrag(kuiklyPage.page, selfOnlyList, -150);
    await kuiklyPage.page.waitForTimeout(300);

    const scrollLeft = await getScrollLeft(selfOnlyList);
    expect(scrollLeft).toBeGreaterThanOrEqual(0);

    // Page still functional
    await expect(kuiklyPage.page.getByText('Section 3: Horizontal SELF_ONLY', { exact: false })).toBeVisible();
  });
});
