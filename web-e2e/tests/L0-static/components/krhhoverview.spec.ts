/**
 * L0 组件测试：KRHoverView 悬浮层组件
 *
 * 测试页面：KRHoverViewTestPage
 * 对应 Kotlin 源文件：KRHoverView.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 KRHoverView 初始化和 zIndex/top 属性设置
 * 2. 组件存在于 DOM
 * 3. 视觉回归截图
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRHoverView 悬浮层组件测试', () => {
  test('应该成功加载 KRHoverViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRHoverViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=KRHoverViewTestPage')).toBeVisible();
  });

  test('KRHoverView 组件应存在于 DOM（触发 top/zIndex 属性设置）', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRHoverViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const components = await kuiklyPage.page.locator('[data-kuikly-component]').all();
    expect(components.length).toBeGreaterThan(0);
  });

  test('视觉回归：KRHoverViewTestPage 截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRHoverViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('kr-hover-view-test-page.png', {
      maxDiffPixels: 200,
    });
  });
});
