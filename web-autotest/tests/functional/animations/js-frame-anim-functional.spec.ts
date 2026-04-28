import { test, expect } from '../../../fixtures/test-base';

const PROGRESS_DONE = '进度: 100%';
const COLOR_DONE = '当前色块: 5 / 5';
const START_PROGRESS = '开始动画';
const RUNNING_PROGRESS = '运行中...';
const START_COLOR = '开始轮播';
const RUNNING_COLOR = '轮播中...';
const START_MARQUEE = '开始跑马灯';
const START_COUNT = '开始计数';
const RUNNING_COUNT = '计数中...';

async function waitForIdleLabel(page, label, timeout = 8000) {
  await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('JS 帧动画 functional 验证', () => {
  test('进度条与颜色轮播动画应到达预期终态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    const startProgressBtn = kuiklyPage.page.getByText(START_PROGRESS, { exact: true }).first();
    await expect(startProgressBtn).toBeVisible({ timeout: 10000 });
    await startProgressBtn.click();
    await expect(kuiklyPage.page.getByText(RUNNING_PROGRESS, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_PROGRESS);
    await expect(kuiklyPage.page.getByText(PROGRESS_DONE, { exact: true })).toBeVisible();

    const startColorBtn = kuiklyPage.page.getByText(START_COLOR, { exact: true }).first();
    await expect(startColorBtn).toBeVisible({ timeout: 10000 });
    await startColorBtn.click();
    await expect(kuiklyPage.page.getByText(RUNNING_COLOR, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_COLOR);
    await expect(kuiklyPage.page.getByText(COLOR_DONE, { exact: true })).toBeVisible();
  });

  test('跑马灯与计数动画应可独立完成', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    const startMarqueeBtn = kuiklyPage.page.getByText(START_MARQUEE, { exact: true }).first();
    await expect(startMarqueeBtn).toBeVisible({ timeout: 10000 });
    await startMarqueeBtn.click();
    await expect(kuiklyPage.page.getByText(RUNNING_PROGRESS, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_MARQUEE, 6000);

    const startCountBtn = kuiklyPage.page.getByText(START_COUNT, { exact: true }).first();
    await expect(startCountBtn).toBeVisible({ timeout: 10000 });
    await startCountBtn.click();
    await expect(kuiklyPage.page.getByText(RUNNING_COUNT, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_COUNT);
    await expect(kuiklyPage.page.getByText('100', { exact: true })).toBeVisible();
  });
});
