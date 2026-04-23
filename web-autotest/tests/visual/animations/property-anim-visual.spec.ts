import { test, expect } from '../../../fixtures/test-base';

const IS_CI = process.env.CI === 'true';
const COLOR_ACTION = '变换颜色';
const RESTORE_COLOR = '还原颜色';
const COMBO_ACTION = '平移+旋转';
const RESTORE_ACTION = '还原';
const PLAY_TRANSLATE = '播放平移';

async function waitForText(page, text, timeout = 5000) {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('属性动画 visual 验证', () => {
  test('PropertyAnimTestPage 初始状态应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('property-anim-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('颜色动画终态应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(COLOR_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_COLOR);

    await expect(kuiklyPage.page).toHaveScreenshot('property-anim-color-final.png', {
      maxDiffPixels: 500,
    });
  });

  test('组合动画终态应保持视觉基线稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(COMBO_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_ACTION);

    await expect(kuiklyPage.page).toHaveScreenshot('property-anim-combo-final.png', {
      maxDiffPixels: 500,
    });
  });

  test('属性动画过程帧序列应存在可见差异（本地模式）', async ({ kuiklyPage }) => {
    test.skip(IS_CI, '帧序列对比在 CI 环境跳过，仅本地运行');

    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(PLAY_TRANSLATE, { exact: true }).click();
    const frames = await kuiklyPage.captureAnimationFrames({
      interval: 100,
      maxDuration: 1200,
    });

    expect(frames.length).toBeGreaterThanOrEqual(3);
    const diffCount = kuiklyPage.countFrameDiffs(frames, { threshold: 0.001 });
    expect(diffCount).toBeGreaterThanOrEqual(1);
  });
});
