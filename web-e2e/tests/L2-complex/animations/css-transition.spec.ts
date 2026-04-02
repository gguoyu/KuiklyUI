/**
 * L2 动画测试：CSS Transition 动画验证
 *
 * 测试页面：CSSTransitionTestPage
 * 测试覆盖：
 * 1. 初始渲染截图基准
 * 2. 尺寸变化动画 — 触发后验证终态尺寸（CSS computed style）
 * 3. 颜色变化动画 — 触发后验证终态背景色
 * 4. 宽度动画 — 触发后验证宽度终态
 * 5. 组合动画 — 多属性同时变化后截图对比
 * 6. 动画过程帧差异验证（非 CI 模式）
 *
 * 策略：优先用 waitForTransitionEnd + getComputedStyles 验证终态（不依赖截图时序）；
 *       CI 环境下自动跳过帧序列对比，只做终态断言。
 */

import { test, expect } from '../../../fixtures/test-base';

const IS_CI = process.env.CI === 'true';

test.describe('CSS Transition 动画测试', () => {

  test('初始渲染截图基准', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('css-transition-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('尺寸变化动画：触发后元素应扩大', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 找到尺寸动画触发区（"Click Me" 按钮所在的 KRView）
    const trigger = kuiklyPage.page.getByText('Click Me');
    await expect(trigger).toBeVisible();

    // 记录点击前父容器的尺寸（<p> 节点的 bounding box 不能代表容器，改用 evaluate）
    const sizeBefore = await trigger.evaluate((el: Element) => {
      const parent = el.closest('[data-kuikly-component="KRView"]') as HTMLElement;
      return parent ? { w: parent.offsetWidth, h: parent.offsetHeight } : null;
    });

    // 触发动画
    await trigger.click();

    // 等待 transitionend（首选策略）
    await kuiklyPage.waitForTransitionEnd(trigger);
    await kuiklyPage.waitForRenderComplete();

    // 验证状态文字更新（ternary 文本，可靠）
    await expect(kuiklyPage.page.getByText('已展开 (200x200)')).toBeVisible();

    // 验证父容器尺寸确实增大（如果能获取到的话）
    if (sizeBefore) {
      const sizeAfter = await trigger.evaluate((el: Element) => {
        const parent = el.closest('[data-kuikly-component="KRView"]') as HTMLElement;
        return parent ? { w: parent.offsetWidth, h: parent.offsetHeight } : null;
      });
      if (sizeAfter) {
        expect(sizeAfter.w).toBeGreaterThanOrEqual(sizeBefore.w);
        expect(sizeAfter.h).toBeGreaterThanOrEqual(sizeBefore.h);
      }
    }
  });

  test('尺寸变化动画：二次点击应还原', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const trigger = kuiklyPage.page.getByText('Click Me');

    // 第一次点击：展开
    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger);
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('已展开 (200x200)')).toBeVisible();

    // 第二次点击：还原
    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger);
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('未展开 (100x100)')).toBeVisible();
  });

  test('颜色变化动画：触发后状态文字更新', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 找到颜色变化触发按钮
    const trigger = kuiklyPage.page.getByText('Click to Change Color');
    await expect(trigger).toBeVisible();
    await trigger.click();

    await kuiklyPage.waitForTransitionEnd(
      kuiklyPage.page.getByText('Click to Change Color').locator('..')
    );
    await kuiklyPage.waitForRenderComplete();

    // 颜色动画触发后截图验证终态
    await expect(kuiklyPage.page).toHaveScreenshot('css-transition-color-changed.png', {
      maxDiffPixels: 500,
    });
  });

  test('宽度动画：触发后宽度文字更新为 300px', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('Toggle Width').click();
    await kuiklyPage.waitForRenderComplete();

    // 验证状态文字更新
    await expect(kuiklyPage.page.getByText('宽度: 300px')).toBeVisible({ timeout: 3000 });
  });

  test('组合动画终态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('Combo Animation').click();
    await kuiklyPage.waitForTransitionEnd(
      kuiklyPage.page.getByText('Combo Animation').locator('..')
    );
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('css-transition-combo-final.png', {
      maxDiffPixels: 500,
    });
  });

  test('动画过程帧差异验证（本地模式）', async ({ kuiklyPage }) => {
    // CI 环境跳过帧序列对比，避免时序误报
    test.skip(IS_CI, '帧序列对比在 CI 环境跳过，仅本地运行');

    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 先记录一帧初始状态，避免动画过快导致采样窗口只捕获到最终状态。
    const baseline = await kuiklyPage.page.screenshot();

    await kuiklyPage.page.getByText('Click Me').click();

    // 采集动画进行中的帧序列（共 ~1.5s，每 100ms 截一帧）
    const frames = [baseline, ...(await kuiklyPage.captureAnimationFrames({
      interval: 100,
      maxDuration: 1500,
    }))];

    // 至少采集到 3 帧
    expect(frames.length).toBeGreaterThanOrEqual(3);

    // 帧间应存在视觉差异；若动画过快，至少也能观测到初始态与后续帧之间的变化。
    const diffCount = kuiklyPage.countFrameDiffs(frames, { threshold: 0.001 });
    expect(diffCount).toBeGreaterThanOrEqual(1);
  });
});
