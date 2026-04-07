// @kuikly-autogen {"pageName":"KRViewTestPage","category":"components","sourceFile":"demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/components/KRViewTestPage.kt","managedBy":"kuikly-web-autotest","templateProfile":"default"}
import { test, expect } from '../../../fixtures/test-base';

const PAGE_NAME = "KRViewTestPage";
const TITLE_TEXT = "1. 不同尺寸";
const STABLE_TEXTS = [
  "1. 不同尺寸",
  "2. 不同背景色",
  "3. 不同圆角",
  "4. 边框样式"
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

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("KRViewTestPage");
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('exercises extracted controls on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    test.skip(ACTION_LABELS.length === 0, 'No clickable labels were extracted from page source.');

    await kuiklyPage.goto("KRViewTestPage");
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);

    let clickedCount = 0;
    for (const label of ACTION_LABELS) {
      const clicked = await clickLabelIfPresent(kuiklyPage, label);
      if (!clicked) {
        continue;
      }

      clickedCount += 1;
      await kuiklyPage.page.waitForTimeout(250);
      await expectPageReady(kuiklyPage);
    }

    expect(clickedCount).toBeGreaterThan(0);
  });
});
