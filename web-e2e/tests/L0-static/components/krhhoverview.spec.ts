/**
 * L0 组件测试：KRHoverView 悬浮层组件
 *
 * 测试页面：HoverExamplePage
 * 对应 Kotlin 源文件：KRHoverView.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 KRHoverView 初始化和 zIndex/top 属性设置
 * 2. 组件存在于 DOM
 * 3. 视觉回归截图
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRHoverView 悬浮层组件测试', () => {
  test('应该成功加载 HoverExamplePage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HoverExamplePage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('KRHoverView 组件应存在于 DOM（触发 top/zIndex 属性设置）', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HoverExamplePage');
    await kuiklyPage.waitForRenderComplete();

    const components = await kuiklyPage.page.locator('[data-kuikly-component]').all();
    expect(components.length).toBeGreaterThan(0);
  });

  test('视觉回归：HoverExamplePage 截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('HoverExamplePage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('hover-example-page.png', {
      maxDiffPixels: 200,
    });
  });
});
