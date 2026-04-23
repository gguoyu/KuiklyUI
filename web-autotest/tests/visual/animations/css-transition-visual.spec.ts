import { test, expect } from '../../../fixtures/test-base';

const IS_CI = process.env.CI === 'true';

test.describe('CSS Transition 视觉验证', () => {
  test('初始渲染截图基准', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('css-transition-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('组合动画终态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const trigger = kuiklyPage.page.getByText('Combo Animation');
    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('css-transition-combo-final.png', {
      maxDiffPixels: 500,
    });
  });

  test('动画过程帧差异验证（本地模式）', async ({ kuiklyPage }) => {
    test.skip(IS_CI, '帧序列对比在 CI 环境跳过，仅本地运行');

    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const baseline = await kuiklyPage.page.screenshot();
    await kuiklyPage.page.getByText('Click Me').click();

    const frames = [baseline, ...(await kuiklyPage.captureAnimationFrames({
      interval: 100,
      maxDuration: 1500,
    }))];

    expect(frames.length).toBeGreaterThanOrEqual(3);

    const diffCount = kuiklyPage.countFrameDiffs(frames, { threshold: 0.001 });
    expect(diffCount).toBeGreaterThanOrEqual(1);
  });
});
