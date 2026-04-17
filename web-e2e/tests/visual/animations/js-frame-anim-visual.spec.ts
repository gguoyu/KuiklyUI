import { test, expect } from '../../../fixtures/test-base';

const IS_CI = process.env.CI === 'true';
const START_PROGRESS = '开始动画';
const START_MARQUEE = '开始跑马灯';

async function waitForIdleLabel(page, label, timeout = 8000) {
  await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('JS 帧动画 visual 验证', () => {
  test('JSFrameAnimTestPage 初始状态应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('js-frame-anim-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('跑马灯动画终态应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(START_MARQUEE, { exact: true }).click();
    await waitForIdleLabel(kuiklyPage.page, START_MARQUEE, 6000);

    await expect(kuiklyPage.page).toHaveScreenshot('js-frame-anim-marquee-end.png', {
      maxDiffPixels: 500,
    });
  });

  test('动画过程帧序列应存在可见差异（本地模式）', async ({ kuiklyPage }) => {
    test.skip(IS_CI, '帧序列对比在 CI 环境跳过，仅本地运行');

    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(START_PROGRESS, { exact: true }).click();
    const frames = await kuiklyPage.captureAnimationFrames({
      interval: 80,
      maxDuration: 1000,
    });

    expect(frames.length).toBeGreaterThanOrEqual(5);
    const diffCount = kuiklyPage.countFrameDiffs(frames, { threshold: 0.001 });
    expect(diffCount).toBeGreaterThanOrEqual(2);
  });
});
