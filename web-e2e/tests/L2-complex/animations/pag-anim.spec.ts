/**
 * L2 动画测试：PAG 动画验证
 *
 * 测试页面：PAGAnimTestPage
 *
 * ⚠️ 当前状态：PAGAnimTestPage 测试页面依赖 PAG SDK（第三方 Canvas 动画库），
 *    需要在 demo 项目中额外集成 PAG Web SDK 后才能实现。
 *    本文件作为占位符，所有用例暂时跳过，待 PAG 集成完成后补全。
 *
 * 计划实现的测试覆盖：
 * 1. Canvas 元素存在且非透明 — 证明 PAG 有渲染输出
 * 2. 播放前/后截图基准对比
 * 3. 定时帧序列采集 — 验证帧间有视觉差异（动画在播放）
 * 4. 暂停/恢复功能验证
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('PAG 动画测试', () => {

  test.skip('PAG 动画：Canvas 应存在且有渲染输出', async ({ kuiklyPage }) => {
    // TODO: 待 PAGAnimTestPage 实现后解除 skip
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证 Canvas 组件存在
    const canvas = kuiklyPage.component('KRCanvasView').first();
    await expect(canvas).toBeVisible();

    // 验证 Canvas 非全透明（有渲染输出）：检查 canvas 像素数据
    const hasContent = await canvas.evaluate((el) => {
      const canvas = el.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      // 检查是否有非透明像素
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return true;
      }
      return false;
    });
    expect(hasContent).toBe(true);
  });

  test.skip('PAG 动画：播放帧序列应有视觉差异', async ({ kuiklyPage }) => {
    // TODO: 待 PAGAnimTestPage 实现后解除 skip
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 采集动画帧序列
    const frames = await kuiklyPage.captureAnimationFrames({
      interval: 100,
      maxDuration: 2000,
    });

    expect(frames.length).toBeGreaterThan(3);

    // 至少有一对相邻帧存在差异（PAG 在播放）
    const diffCount = kuiklyPage.countFrameDiffs(frames, { threshold: 0.002 });
    expect(diffCount).toBeGreaterThan(0);
  });

  test.skip('PAG 动画：初始状态截图基准', async ({ kuiklyPage }) => {
    // TODO: 待 PAGAnimTestPage 实现后解除 skip
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('pag-anim-initial.png', {
      maxDiffPixels: 300,
    });
  });
});
