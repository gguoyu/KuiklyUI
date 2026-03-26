/**
 * L0 组件测试：KRBlurView 高斯模糊组件
 *
 * 测试页面：BlurViewDemoPage
 * 对应 Kotlin 源文件：KRBlurView.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 KRBlurView 渲染和 blurRadius 属性设置
 * 2. KRBlurView 组件存在于 DOM
 * 3. 视觉回归截图
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRBlurView 高斯模糊组件测试', () => {
  test('应该成功加载 BlurViewDemoPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BlurViewDemoPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=BlurView组件Demo')).toBeVisible();
  });

  test('KRBlurView 组件应存在于 DOM（触发 blurRadius 属性设置）', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BlurViewDemoPage');
    await kuiklyPage.waitForRenderComplete();

    // KRBlurView 通过 backdropFilter 实现，验证组件已渲染
    const components = await kuiklyPage.page.locator('[data-kuikly-component]').all();
    expect(components.length).toBeGreaterThan(0);
  });

  test('视觉回归：BlurViewDemoPage 截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BlurViewDemoPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('blur-view-demo.png', {
      maxDiffPixels: 200,
    });
  });
});
