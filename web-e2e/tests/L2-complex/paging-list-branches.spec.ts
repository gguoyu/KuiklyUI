import { test, expect, type Locator, type Page } from '../../fixtures/test-base';

async function getLeft(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

async function dragPageList(page: Page, container: Locator, deltaX: number): Promise<void> {
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
  await page.waitForTimeout(500);
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

test.describe('H5ListPagingHelper branch coverage', () => {
  test('dragging right after entering the next page should keep page 1 visible without advancing further', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');

    await dragPageList(kuiklyPage.page, pageList, -260);
    await expect(kuiklyPage.page.getByText('tab1')).toHaveCSS('color', 'rgb(255, 0, 0)');

    await dragTowardsPreviousPage(kuiklyPage.page, pageList);

    const leftAfterReturn = await getLeft(page1Item);
    await expect(kuiklyPage.page.getByText('tab1')).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(leftAfterReturn).toBeGreaterThanOrEqual(100);
    expect(await getLeft(page0Item)).toBeLessThan(0);
  });

  test('jumping from the last page back to tab0 should reset the page offset', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await kuiklyPage.page.getByText('tab0', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page3Item = kuiklyPage.page.getByText('pageIndex:3 listIndex:0');

    await expect(kuiklyPage.page.getByText('tab0')).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page3Item)).toBeGreaterThan(900);
  });

  test('jumping from page 2 back to tab0 should realign the first page without leaving tab2 onscreen', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page2Item = kuiklyPage.page.getByText('pageIndex:2 listIndex:0');

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await kuiklyPage.page.getByText('tab0', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page.getByText('tab0')).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page2Item)).toBeGreaterThan(600);
  });

  test('short right drag on page 2 should snap back to tab2 without switching pages', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');
    const page2Item = kuiklyPage.page.getByText('pageIndex:2 listIndex:0');

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    await dragPageList(kuiklyPage.page, pageList, 40);

    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page2Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page1Item)).toBeLessThan(0);
  });

  test('vertical dominant drag should not switch the horizontal pagelist', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');
    const initialPage0Left = await getLeft(page0Item);
    const initialPage1Left = await getLeft(page1Item);

    await dragPageListByOffset(kuiklyPage.page, pageList, 40, 220);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page0Item)).toBe(initialPage0Left);
    expect(await getLeft(page1Item)).toBe(initialPage1Left);
  });

  test('small horizontal drag below threshold should keep the first page selected', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');
    const initialPage0Left = await getLeft(page0Item);
    const initialPage1Left = await getLeft(page1Item);

    await dragPageListByOffset(kuiklyPage.page, pageList, -30, 0, 1500);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', 'rgb(0, 0, 0)');
    expect(await getLeft(page0Item)).toBe(initialPage0Left);
    expect(await getLeft(page1Item)).toBe(initialPage1Left);
  });
});
