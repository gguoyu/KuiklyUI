import { test, expect } from '../../fixtures/test-base';

const PAGE_ZERO_ITEM = 'pageIndex:0 listIndex:0';
const PAGE_ONE_ITEM = 'pageIndex:1 listIndex:0';

async function getLeft(locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

test.describe('PageList static 验证', () => {
  test('应该成功加载 PageListTestPage 并展示初始分页布局', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListTestPage');
    await kuiklyPage.waitForRenderComplete();

    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await expect(kuiklyPage.page.getByText('PageListTestPage', { exact: true })).toBeVisible();
    await expect(page0Item).toBeVisible();
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page1Item)).toBeGreaterThan(300);
  });
});
