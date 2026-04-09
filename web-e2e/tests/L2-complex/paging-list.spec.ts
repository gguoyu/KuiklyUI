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

test.describe('H5ListPagingHelper 分页列表测试', () => {
  test('应该成功加载 PageListTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');

    await expect(kuiklyPage.page.getByText('PageListTestPage')).toBeVisible();
    await expect(page0Item).toBeVisible();
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page1Item)).toBeGreaterThan(300);
  });

  test('向左拖拽分页列表后应切换到下一页内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');

    await expect(page0Item).toBeVisible();
    await dragPageList(kuiklyPage.page, pageList, -260);

    await expect(kuiklyPage.page.getByText('tab1')).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page0Item)).toBeLessThan(0);
  });

  test('第一页向右拖拽时应保持在边界页', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');

    await expect(kuiklyPage.page.getByText('tab0')).toHaveCSS('color', 'rgb(255, 0, 0)');
    await dragTowardsPreviousPage(kuiklyPage.page, pageList);

    await expect(kuiklyPage.page.getByText('tab0')).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page1Item)).toBeGreaterThan(300);
  });

  test('点击 tab 应通过 setContentOffset 切换到指定页', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page3Item = kuiklyPage.page.getByText('pageIndex:3 listIndex:0');

    await expect(kuiklyPage.page.getByText('tab3')).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page3Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page0Item)).toBeLessThan(-700);
  });

  test('small left drag on the first page should expose page1 without jumping past it', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText('pageIndex:0 listIndex:0');
    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');

    await dragPageList(kuiklyPage.page, pageList, -80);

    await expect(kuiklyPage.page.getByText('tab1')).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page0Item)).toBeLessThan(0);
  });

  test('dragging left again on the last page should stay pinned to tab3', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page2Item = kuiklyPage.page.getByText('pageIndex:2 listIndex:0');
    const page3Item = kuiklyPage.page.getByText('pageIndex:3 listIndex:0');

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    const boundaryLeft = await getLeft(page3Item);

    await dragPageList(kuiklyPage.page, pageList, -260);

    await expect(kuiklyPage.page.getByText('tab3')).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page3Item)).toBe(boundaryLeft);
    expect(await getLeft(page2Item)).toBeLessThan(0);
  });
});
