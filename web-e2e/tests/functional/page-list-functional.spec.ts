import { test, expect, type Locator, type Page } from '../../fixtures/test-base';

const PAGE_ZERO_ITEM = 'pageIndex:0 listIndex:0';
const PAGE_ONE_ITEM = 'pageIndex:1 listIndex:0';
const PAGE_TWO_ITEM = 'pageIndex:2 listIndex:0';
const PAGE_THREE_ITEM = 'pageIndex:3 listIndex:0';
const ACTIVE_COLOR = 'rgb(255, 0, 0)';
const INACTIVE_COLOR = 'rgb(0, 0, 0)';

async function getLeft(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

async function dragPageList(page: Page, container: Locator, deltaX: number, waitMs = 500): Promise<void> {
  const box = await container.boundingBox();
  if (!box) {
    throw new Error('PageList container is not visible');
  }

  const startX = box.x + box.width * 0.75;
  const endX = startX + deltaX;
  const y = box.y + box.height / 2;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(waitMs);
}

async function dragTowardsPreviousPage(page: Page, container: Locator): Promise<void> {
  const box = await container.boundingBox();
  if (!box) {
    throw new Error('PageList container is not visible');
  }

  const startX = box.x + box.width * 0.25;
  const endX = box.x + box.width * 0.85;
  const y = box.y + box.height / 2;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
}

async function dragPageListByOffset(page: Page, container: Locator, deltaX: number, deltaY: number, waitMs = 800): Promise<void> {
  const box = await container.boundingBox();
  if (!box) {
    throw new Error('PageList container is not visible');
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 14 });
  await page.mouse.up();
  await page.waitForTimeout(waitMs);
}

async function wheelPageList(page: Page, container: Locator, deltaX: number, deltaY: number, waitMs = 500): Promise<void> {
  await container.evaluate((element, payload) => {
    element.dispatchEvent(new WheelEvent('wheel', {
      deltaX: payload.deltaX,
      deltaY: payload.deltaY,
      bubbles: true,
      cancelable: true,
    }));
  }, { deltaX, deltaY });

  await page.waitForTimeout(waitMs);
}

test.describe('PageList functional 验证', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('拖拽分页列表后应切换到下一页', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await expect(pageList).toBeVisible();
    await dragPageList(kuiklyPage.page, pageList, -260);

    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page0Item)).toBeLessThan(0);
  });

  test('第一页向右拖拽时应保持在边界页', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    await dragTowardsPreviousPage(kuiklyPage.page, pageList);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page1Item)).toBeGreaterThan(300);
  });

  test('点击分页 tab 后应跳转到目标页', async ({ kuiklyPage }) => {
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page3Item = kuiklyPage.page.getByText(PAGE_THREE_ITEM, { exact: true });

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(800);

    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page3Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page0Item)).toBeLessThan(-700);
  });

  test('small left drag on the first page should expose page1 without jumping past it', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await dragPageList(kuiklyPage.page, pageList, -80);

    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page0Item)).toBeLessThan(0);
  });

  test('dragging left again on the last page should stay pinned to tab3', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page2Item = kuiklyPage.page.getByText(PAGE_TWO_ITEM, { exact: true });
    const page3Item = kuiklyPage.page.getByText(PAGE_THREE_ITEM, { exact: true });

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    const boundaryLeft = await getLeft(page3Item);

    await dragPageList(kuiklyPage.page, pageList, -260);

    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page3Item)).toBe(boundaryLeft);
    expect(await getLeft(page2Item)).toBeLessThan(0);
  });

  test('dragging right after entering the next page should keep page 1 visible without advancing further', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await dragPageList(kuiklyPage.page, pageList, -260);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);

    await dragTowardsPreviousPage(kuiklyPage.page, pageList);

    const leftAfterReturn = await getLeft(page1Item);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(leftAfterReturn).toBeGreaterThanOrEqual(100);
    expect(await getLeft(page0Item)).toBeLessThan(0);
  });

  test('jumping from the last page back to tab0 should reset the page offset', async ({ kuiklyPage }) => {
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page3Item = kuiklyPage.page.getByText(PAGE_THREE_ITEM, { exact: true });

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await kuiklyPage.page.getByText('tab0', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page3Item)).toBeGreaterThan(900);
  });

  test('jumping from page 2 back to tab0 should realign the first page without leaving tab2 onscreen', async ({ kuiklyPage }) => {
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page2Item = kuiklyPage.page.getByText(PAGE_TWO_ITEM, { exact: true });

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await kuiklyPage.page.getByText('tab0', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page2Item)).toBeGreaterThan(600);
  });

  test('short right drag on page 2 should snap back to tab2 without switching pages', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });
    const page2Item = kuiklyPage.page.getByText(PAGE_TWO_ITEM, { exact: true });

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    await dragPageList(kuiklyPage.page, pageList, 40);

    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page2Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page1Item)).toBeLessThan(0);
  });

  test('vertical dominant drag should not switch the horizontal pagelist', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });
    const initialPage0Left = await getLeft(page0Item);
    const initialPage1Left = await getLeft(page1Item);

    await dragPageListByOffset(kuiklyPage.page, pageList, 40, 220);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page0Item)).toBe(initialPage0Left);
    expect(await getLeft(page1Item)).toBe(initialPage1Left);
  });

  test('small horizontal drag below threshold should keep the first page selected', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });
    const initialPage0Left = await getLeft(page0Item);
    const initialPage1Left = await getLeft(page1Item);

    await dragPageListByOffset(kuiklyPage.page, pageList, -30, 0, 1500);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', INACTIVE_COLOR);
    expect(await getLeft(page0Item)).toBe(initialPage0Left);
    expect(await getLeft(page1Item)).toBe(initialPage1Left);
  });

  test('clicking tab2 then tab1 should update the highlighted tab and visible page each time', async ({ kuiklyPage }) => {
    const page2Item = kuiklyPage.page.getByText(PAGE_TWO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page2Item)).toBeGreaterThanOrEqual(0);

    await kuiklyPage.page.getByText('tab1', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);
  });

  test('jumping from tab3 back to tab2 should realign page2 and push page3 offscreen', async ({ kuiklyPage }) => {
    const page2Item = kuiklyPage.page.getByText(PAGE_TWO_ITEM, { exact: true });
    const page3Item = kuiklyPage.page.getByText(PAGE_THREE_ITEM, { exact: true });

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page2Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page3Item)).toBeGreaterThan(300);
  });

  test('wheel scrolling should page forward and stop at the last page boundary', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page3Item = kuiklyPage.page.getByText(PAGE_THREE_ITEM, { exact: true });

    await wheelPageList(kuiklyPage.page, pageList, 500, 0);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);

    await wheelPageList(kuiklyPage.page, pageList, 500, 0);
    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);

    await wheelPageList(kuiklyPage.page, pageList, 500, 0);
    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);

    const boundaryLeft = await getLeft(page3Item);
    await wheelPageList(kuiklyPage.page, pageList, 500, 0);

    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page3Item)).toBe(boundaryLeft);
  });

  test('wheel scrolling backward should page back and stop at the first page boundary', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    await wheelPageList(kuiklyPage.page, pageList, -500, 0);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);

    await wheelPageList(kuiklyPage.page, pageList, -500, 0);
    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);

    const boundaryLeft = await getLeft(page0Item);
    await wheelPageList(kuiklyPage.page, pageList, -500, 0);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page0Item)).toBe(boundaryLeft);
  });

  test('rapid repeated wheel input should only advance one page before the lock resets', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });
    const page2Item = kuiklyPage.page.getByText(PAGE_TWO_ITEM, { exact: true });

    await wheelPageList(kuiklyPage.page, pageList, 500, 0, 0);
    await wheelPageList(kuiklyPage.page, pageList, 500, 0, 500);

    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);

    await wheelPageList(kuiklyPage.page, pageList, 500, 0);
    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page2Item)).toBeGreaterThanOrEqual(0);
  });

  test('vertical wheel input should not switch the horizontal pagelist', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const boundaryLeft = await getLeft(page0Item);

    await wheelPageList(kuiklyPage.page, pageList, 0, 500);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    expect(await getLeft(page0Item)).toBe(boundaryLeft);
  });
});
