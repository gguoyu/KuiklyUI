// @kuikly-autogen {"pageName":"PageListTestPage","category":"interactions","sourceFile":"demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/interactions/PageListTestPage.kt","managedBy":"kuikly-web-autotest","templateProfile":"interaction-page-list"}
import { test, expect } from '../../fixtures/test-base';

const PAGE_NAME = "PageListTestPage";
const TITLE_TEXT = "PageListTestPage";
const STABLE_TEXTS = [
  "PageListTestPage"
];
const ACTION_LABELS = [];

async function expectPageReady(kuiklyPage) {
  if (TITLE_TEXT) {
    await expect(kuiklyPage.page.getByText(TITLE_TEXT, { exact: false }).first()).toBeVisible();
    return;
  }

  if (STABLE_TEXTS.length > 0) {
    await expect(kuiklyPage.page.getByText(STABLE_TEXTS[0], { exact: false }).first()).toBeVisible();
    return;
  }

  await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
}

async function clickLabelIfPresent(kuiklyPage, label) {
  const exact = kuiklyPage.page.getByText(label, { exact: true });
  if (await exact.count()) {
    await exact.first().click({ force: true, timeout: 2000 }).catch(() => {});
    return true;
  }

  const fuzzy = kuiklyPage.page.getByText(label, { exact: false });
  if (await fuzzy.count()) {
    await fuzzy.first().click({ force: true, timeout: 2000 }).catch(() => {});
    return true;
  }

  return false;
}

const PAGE_ZERO_ITEM = 'pageIndex:0 listIndex:0';
const PAGE_ONE_ITEM = 'pageIndex:1 listIndex:0';
const PAGE_THREE_ITEM = 'pageIndex:3 listIndex:0';

async function dragPageList(page, container, deltaX) {
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
  await page.waitForTimeout(800);
}

async function getLeft(locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("PageListTestPage");
    await kuiklyPage.waitForRenderComplete();

    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await expect(kuiklyPage.page.getByText('PageListTestPage', { exact: true })).toBeVisible();
    await expect(page0Item).toBeVisible();
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page1Item)).toBeGreaterThan(300);
  });

  test('swipes and clicks tabs on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("PageListTestPage");
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });
    const page3Item = kuiklyPage.page.getByText(PAGE_THREE_ITEM, { exact: true });

    await dragPageList(kuiklyPage.page, pageList, -260);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page0Item)).toBeLessThan(0);

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(800);
    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page3Item)).toBeGreaterThanOrEqual(0);
  });
});
