// @kuikly-autogen {"pageName":"ListScrollTestPage","category":"interactions","sourceFile":"demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/interactions/ListScrollTestPage.kt","managedBy":"kuikly-web-autotest","templateProfile":"interaction-list-scroll"}
import { test, expect } from '../../fixtures/test-base';

const PAGE_NAME = "ListScrollTestPage";
const TITLE_TEXT = "列表滚动测试";
const STABLE_TEXTS = [
  "列表滚动测试",
  "选中: ${ctx.clickedItemText}",
  "分组 ${group + 1}",
  "分组${group + 1} 第${item + 1}项 · 副标题描述"
];
const ACTION_LABELS = [
  "${index + 1}"
];

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

const LIST_TITLE = '列表滚动测试';
const LIST_GROUP_ONE = '分组 1';
const LIST_GROUP_THREE = '分组 3';
const LIST_ITEM_ONE = '列表项 1';
const LIST_ITEM_EIGHT = '列表项 8';
const LIST_ITEM_TWENTY_ONE = '列表项 21';
const LIST_SELECTED_ONE = '选中: 列表项 1';
const LIST_SELECTED_EIGHT = '选中: 列表项 8';
async function listContainer(kuiklyPage) {
  return kuiklyPage.component('KRListView').first();
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("ListScrollTestPage");
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(LIST_TITLE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(LIST_GROUP_ONE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(LIST_ITEM_ONE, { exact: true })).toBeVisible();
  });

  test('scrolls and selects stable rows on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("ListScrollTestPage");
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(LIST_ITEM_ONE, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(LIST_SELECTED_ONE, { exact: true })).toBeVisible();

    const container = await listContainer(kuiklyPage);
    await kuiklyPage.scrollInContainer(container, { deltaY: 500, smooth: false });
    await expect(kuiklyPage.page.getByText(LIST_ITEM_EIGHT, { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText(LIST_ITEM_EIGHT, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(LIST_SELECTED_EIGHT, { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(container, { deltaY: 1200, smooth: false });
    const scrollTop = await container.evaluate((el) => (el instanceof HTMLElement ? el.scrollTop : 0));
    expect(scrollTop).toBeGreaterThan(900);
    await expect(kuiklyPage.page.getByText(LIST_GROUP_THREE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(LIST_ITEM_TWENTY_ONE, { exact: true })).toBeVisible();

    for (let i = 0; i < 8; i += 1) {
      await kuiklyPage.scrollInContainer(container, { deltaY: 350, smooth: false });
    }

    const finalScrollTop = await container.evaluate((el) => (el instanceof HTMLElement ? el.scrollTop : 0));
    expect(finalScrollTop).toBeGreaterThan(1800);
  });
});
