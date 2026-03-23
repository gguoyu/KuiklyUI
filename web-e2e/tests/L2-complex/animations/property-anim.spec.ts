/**
 * L2 动画测试：KR 属性动画验证
 *
 * 测试页面：PropertyAnimTestPage
 * 测试覆盖：
 * 1. 初始渲染截图基准
 * 2. Linear 平移动画 — 触发后验证状态文字切换（"还原位置"）
 * 3. Spring 弹性动画 — 触发后验证状态文字切换
 * 4. 背景色属性动画 — 触发后截图验证终态
 * 5. 组合动画（平移+旋转）— 触发后截图验证终态
 * 6. 动画过程帧差异验证（非 CI 模式）
 *
 * 策略：属性动画通过按钮文字状态变化（completion 回调驱动）来判断动画已完成，
 *       再做截图或 style 断言，避免依赖固定等待时间。
 */

import { test, expect } from '../../../fixtures/test-base';

const IS_CI = process.env.CI === 'true';

test.describe('KR 属性动画测试', () => {

  test('初始渲染截图基准', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('property-anim-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('Linear 平移动画：触发后按钮文字应变为"还原位置"', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 点击触发 Linear 平移
    await kuiklyPage.page.getByText('播放平移').click();

    // 等待 completion 回调触发：按钮文字变为"还原位置"
    await expect(kuiklyPage.page.getByText('还原位置').first()).toBeVisible({ timeout: 5000 });
  });

  test('Linear 平移动画：还原后按钮文字应回到"播放平移"', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('播放平移').click();
    await expect(kuiklyPage.page.getByText('还原位置').first()).toBeVisible({ timeout: 5000 });

    // 点击还原
    await kuiklyPage.page.getByText('还原位置').first().click();
    await expect(kuiklyPage.page.getByText('播放平移').first()).toBeVisible({ timeout: 5000 });
  });

  test('Spring 弹性动画：触发后按钮文字应变为"还原位置"', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('弹性运动').click();
    await expect(kuiklyPage.page.getByText('还原位置').first()).toBeVisible({ timeout: 5000 });
  });

  test('背景色动画：触发后按钮文字变为"还原颜色"，截图验证终态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('变换颜色').click();

    // 等待 completion 回调
    await expect(kuiklyPage.page.getByText('还原颜色')).toBeVisible({ timeout: 5000 });

    // 终态截图
    await expect(kuiklyPage.page).toHaveScreenshot('property-anim-color-final.png', {
      maxDiffPixels: 500,
    });
  });

  test('组合动画（平移+旋转）：触发后截图验证终态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('平移+旋转').click();
    await expect(kuiklyPage.page.getByText('还原')).toBeVisible({ timeout: 5000 });

    await expect(kuiklyPage.page).toHaveScreenshot('property-anim-combo-final.png', {
      maxDiffPixels: 500,
    });
  });

  test('动画过程帧差异验证（本地模式）', async ({ kuiklyPage }) => {
    test.skip(IS_CI, '帧序列对比在 CI 环境跳过，仅本地运行');

    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 触发 Linear 平移，采集动画中的帧
    await kuiklyPage.page.getByText('播放平移').click();
    const frames = await kuiklyPage.captureAnimationFrames({
      interval: 100,
      maxDuration: 1200,
    });

    expect(frames.length).toBeGreaterThanOrEqual(3);
    const diffCount = kuiklyPage.countFrameDiffs(frames, { threshold: 0.001 });
    expect(diffCount).toBeGreaterThanOrEqual(1);
  });
});
