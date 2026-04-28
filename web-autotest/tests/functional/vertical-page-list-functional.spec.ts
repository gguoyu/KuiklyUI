import { test, expect, type Locator, type Page } from '../../fixtures/test-base';

const ACTIVE_COLOR = 'rgb(255, 0, 0)';
const INACTIVE_COLOR = 'rgb(0, 0, 0)';

async function getTop(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.y;
}

async function dragVerticalPageList(page: Page, container: Locator, deltaY: number, waitMs = 500): Promise<void> {
  const box = await container.boundingBox();
  if (!box) {
    throw new Error('PageList container is not visible');
  }

  const x = box.x + box.width / 2;
  const startY = box.y + box.height * 0.75;
  const endY = startY + deltaY;

  await page.mouse.move(x, startY);
  await page.mouse.down();
  await page.mouse.move(x, endY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(waitMs);
}

async function wheelVerticalPageList(page: Page, container: Locator, deltaX: number, deltaY: number, waitMs = 500): Promise<void> {
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

test.describe('Vertical PageList functional 验证', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('VerticalPageListTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('页面初始渲染应显示 tab0 和第一页内容', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('VerticalPageListTestPage')).toBeVisible();
    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    await expect(kuiklyPage.page.getByText('pageIndex:0 listIndex:0', { exact: true })).toBeVisible();
  });

  test('点击 tab2 应切换到第二页', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('tab2', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(800);

    await expect(kuiklyPage.page.getByText('tab2', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    await expect(kuiklyPage.page.getByText('pageIndex:2 listIndex:0', { exact: true })).toBeVisible();
  });

  test('垂直向上拖拽应切换到下一页', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    await dragVerticalPageList(kuiklyPage.page, pageList, -260);

    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
  });

  test('点击 tab3 再点 tab0 应回到第一页', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);

    await kuiklyPage.page.getByText('tab0', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(500);
    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
    await expect(kuiklyPage.page.getByText('pageIndex:0 listIndex:0', { exact: true })).toBeVisible();
  });

  test('wheel 垂直向下滚动应切换到下一页', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    await wheelVerticalPageList(kuiklyPage.page, pageList, 0, 500);

    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
  });

  test('水平 wheel 不应切换垂直分页', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    await wheelVerticalPageList(kuiklyPage.page, pageList, 500, 0);

    await expect(kuiklyPage.page.getByText('tab0', { exact: true })).toHaveCSS('color', ACTIVE_COLOR);
  });
});
