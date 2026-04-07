// @kuikly-autogen {"pageName":"JSFrameAnimTestPage","category":"animations","sourceFile":"demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/animations/JSFrameAnimTestPage.kt","managedBy":"kuikly-web-autotest","templateProfile":"animation-jsframe"}
import { test, expect } from '../../../fixtures/test-base';

const PAGE_NAME = "JSFrameAnimTestPage";
const TITLE_TEXT = "1. 进度条帧动画";
const STABLE_TEXTS = [
  "1. 进度条帧动画",
  "进度: ${ctx.progressValue}%",
  "2. 跑马灯帧动画",
  "3. 颜色轮播帧动画"
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

const SECTION_TITLE = "1. 进度条帧动画";
const PROGRESS_ZERO = "进度: 0%";
const PROGRESS_DONE = "进度: 100%";
const COLOR_START = "当前色块: 1 / 5";
const COLOR_DONE = "当前色块: 5 / 5";
const START_PROGRESS = "开始动画";
const RUNNING_PROGRESS = "运行中...";
const START_COLOR = "开始轮播";
const RUNNING_COLOR = "轮播中...";
const START_MARQUEE = "开始跑马灯";
const START_COUNT = "开始计数";
const RUNNING_COUNT = "计数中...";

async function waitForIdleLabel(page, label, timeout = 8000) {
  await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("JSFrameAnimTestPage");
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(SECTION_TITLE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(PROGRESS_ZERO, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(COLOR_START, { exact: true })).toBeVisible();
  });

  test('runs progress and color animations on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("JSFrameAnimTestPage");
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(START_PROGRESS, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(RUNNING_PROGRESS, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_PROGRESS);
    await expect(kuiklyPage.page.getByText(PROGRESS_DONE, { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText(START_COLOR, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(RUNNING_COLOR, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_COLOR);
    await expect(kuiklyPage.page.getByText(COLOR_DONE, { exact: true })).toBeVisible();
  });

  test('runs marquee and counter animations on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("JSFrameAnimTestPage");
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(START_MARQUEE, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(RUNNING_PROGRESS, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_MARQUEE, 6000);

    await kuiklyPage.page.getByText(START_COUNT, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(RUNNING_COUNT, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_COUNT);
    await expect(kuiklyPage.page.getByText('100', { exact: true })).toBeVisible();
  });
});
