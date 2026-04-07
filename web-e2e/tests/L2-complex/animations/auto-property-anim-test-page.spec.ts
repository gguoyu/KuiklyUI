// @kuikly-autogen {"pageName":"PropertyAnimTestPage","category":"animations","sourceFile":"demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/animations/PropertyAnimTestPage.kt","managedBy":"kuikly-web-autotest","templateProfile":"animation-property"}
import { test, expect } from '../../../fixtures/test-base';

const PAGE_NAME = "PropertyAnimTestPage";
const TITLE_TEXT = "1. Linear 平移动画";
const STABLE_TEXTS = [
  "1. Linear 平移动画",
  "2. Spring 弹性动画",
  "3. 背景色属性动画",
  "颜色渐变"
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

const SECTION_TITLE = "1. Linear 平移动画";
const PLAY_TRANSLATE = "播放平移";
const RESTORE_POSITION = "还原位置";
const SPRING_ACTION = "弹性运动";
const COLOR_ACTION = "变换颜色";
const RESTORE_COLOR = "还原颜色";
const COMBO_ACTION = "平移+旋转";
const RESTORE_ACTION = "还原";

async function waitForText(page, text, timeout = 5000) {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("PropertyAnimTestPage");
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(SECTION_TITLE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(PLAY_TRANSLATE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(COMBO_ACTION, { exact: true })).toBeVisible();
  });

  test('toggles translate and spring animations on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("PropertyAnimTestPage");
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(PLAY_TRANSLATE, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_POSITION);
    await kuiklyPage.page.getByText(RESTORE_POSITION, { exact: true }).first().click();
    await waitForText(kuiklyPage.page, PLAY_TRANSLATE);

    await kuiklyPage.page.getByText(SPRING_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_POSITION);
  });

  test('toggles color and combo animations on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("PropertyAnimTestPage");
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(COLOR_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_COLOR);

    await kuiklyPage.page.getByText(COMBO_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_ACTION);
  });
});
