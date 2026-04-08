import { test, expect, type Locator } from '../../fixtures/test-base';

async function getLeft(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

test.describe('H5ListPagingHelper extra coverage', () => {
  test('clicking tab2 then tab1 should update the highlighted tab and visible page each time', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');

    const page2Item = kuiklyPage.page.getByText('pageIndex:2 listIndex:0');
    expect(await getLeft(page2Item)).toBeGreaterThanOrEqual(0);

    await kuiklyPage.page.getByText('tab1', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');

    const page1Item = kuiklyPage.page.getByText('pageIndex:1 listIndex:0');
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);
  });

  test('jumping from tab3 back to tab2 should realign page2 and push page3 offscreen', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');

    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);

    const page2Item = kuiklyPage.page.getByText('pageIndex:2 listIndex:0');
    const page3Item = kuiklyPage.page.getByText('pageIndex:3 listIndex:0');

    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page2Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page3Item)).toBeGreaterThan(300);
  });

  test('wheel scrolling should page forward and stop at the last page boundary', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const box = await pageList.boundingBox();
    expect(box).toBeTruthy();

    await kuiklyPage.page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await kuiklyPage.page.mouse.wheel(500, 0);
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');

    await kuiklyPage.page.mouse.wheel(500, 0);
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');

    await kuiklyPage.page.mouse.wheel(500, 0);
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');

    const page3Item = kuiklyPage.page.getByText('pageIndex:3 listIndex:0');
    const boundaryLeft = await getLeft(page3Item);

    await kuiklyPage.page.mouse.wheel(500, 0);
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page3Item)).toBe(boundaryLeft);
  });
});
