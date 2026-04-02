/**
 * L0 组件测试：KRVideoView 视频组件
 *
 * 测试页面：KRVideoViewTestPage
 * 对应 Kotlin 源文件：KRVideoView.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 KRVideoView 渲染
 * 2. 组件存在于 DOM
 * 3. 视觉回归截图
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRVideoView 视频组件测试', () => {
  test('应该成功加载 KRVideoViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=KRVideoViewTestPage')).toBeVisible();
  });

  test('KRVideoView 组件应存在于 DOM', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const components = await kuiklyPage.page.locator('[data-kuikly-component]').all();
    expect(components.length).toBeGreaterThan(0);
  });

  test('视觉回归：KRVideoViewTestPage 截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('kr-video-view-test-page.png', {
      maxDiffPixels: 300,
    });
  });
});
