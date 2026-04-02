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
});
