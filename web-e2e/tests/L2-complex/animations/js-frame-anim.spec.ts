/**
 * L2 动画测试：JS 帧动画验证
 *
 * 测试页面：JSFrameAnimTestPage
 * 测试覆盖：
 * 1. 初始渲染截图基准
 * 2. 进度条帧动画 — 触发后进度值应从 0 增长到 100%
 * 3. 跑马灯帧动画 — 触发后方块应移动到末端（位置 5）
 * 4. 颜色轮播帧动画 — 触发后色块文字应显示 5/5
 * 5. 数字递增帧动画 — 触发后计数值应到达 100
 * 6. 动画过程帧差异验证（非 CI 模式）
 *
 * 策略：帧动画由 setTimeout 驱动，通过等待终态文字（状态文字从"运行中"变回触发态）
 *       来判断动画已完成，再做断言，无需依赖固定时间等待。
 */

import { test, expect } from '../../../fixtures/test-base';

const IS_CI = process.env.CI === 'true';

test.describe('JS 帧动画测试', () => {

  test('初始渲染截图基准', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('js-frame-anim-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('进度条帧动画：触发后进度应到达 100%', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('进度: 0%')).toBeVisible();

    await kuiklyPage.page.getByText('开始动画').click();

    // 等待动画完成（按钮文字从"运行中..."恢复为"开始动画"）
    await expect(kuiklyPage.page.getByText('开始动画').first()).toBeVisible({ timeout: 8000 });

    // 验证进度到达 100%
    await expect(kuiklyPage.page.getByText('进度: 100%')).toBeVisible();
  });

  test('进度条帧动画：动画进行中按钮应显示"运行中..."', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('开始动画').click();

    // 动画刚触发，按钮应立即变为"运行中..."
    await expect(kuiklyPage.page.getByText('运行中...').first()).toBeVisible({ timeout: 1000 });
  });

  test('跑马灯帧动画：触发后方块应移动到末端', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('开始跑马灯').click();

    // 等待动画完成
    await expect(kuiklyPage.page.getByText('开始跑马灯').first()).toBeVisible({ timeout: 5000 });

    // 动画结束截图验证末端状态
    await expect(kuiklyPage.page).toHaveScreenshot('js-frame-anim-marquee-end.png', {
      maxDiffPixels: 500,
    });
  });

  test('颜色轮播帧动画：触发后应显示最后一个色块', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('当前色块: 1 / 5')).toBeVisible();

    await kuiklyPage.page.getByText('开始轮播').click();

    // 等待动画完成
    await expect(kuiklyPage.page.getByText('开始轮播').first()).toBeVisible({ timeout: 5000 });

    // 验证到达最后一个色块
    await expect(kuiklyPage.page.getByText('当前色块: 5 / 5')).toBeVisible();
  });

  test('数字递增帧动画：触发后计数值应到达 100', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('开始计数').click();

    // 等待动画完成（按钮恢复"开始计数"）
    await expect(kuiklyPage.page.getByText('开始计数').first()).toBeVisible({ timeout: 8000 });

    // 终态截图
    await expect(kuiklyPage.page).toHaveScreenshot('js-frame-anim-count-end.png', {
      maxDiffPixels: 300,
    });
  });

  test('多段帧动画：各动画互不干扰，可独立触发', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 先触发颜色轮播
    await kuiklyPage.page.getByText('开始轮播').click();
    await expect(kuiklyPage.page.getByText('开始轮播').first()).toBeVisible({ timeout: 5000 });

    // 再触发数字递增（不受前者影响）
    await kuiklyPage.page.getByText('开始计数').click();
    await expect(kuiklyPage.page.getByText('开始计数').first()).toBeVisible({ timeout: 8000 });

    await expect(kuiklyPage.page.getByText('当前色块: 5 / 5')).toBeVisible();
    await expect(kuiklyPage.page.getByText('进度: 0%')).toBeVisible(); // 进度条未触发应仍为 0
  });

  test('动画过程帧差异验证（本地模式）', async ({ kuiklyPage }) => {
    test.skip(IS_CI, '帧序列对比在 CI 环境跳过，仅本地运行');

    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 触发进度条动画，采集帧序列
    await kuiklyPage.page.getByText('开始动画').click();
    const frames = await kuiklyPage.captureAnimationFrames({
      interval: 80,
      maxDuration: 1000,
    });

    expect(frames.length).toBeGreaterThanOrEqual(5);
    // 进度条递增，帧间应有差异
    const diffCount = kuiklyPage.countFrameDiffs(frames, { threshold: 0.001 });
    expect(diffCount).toBeGreaterThanOrEqual(2);
  });
});
