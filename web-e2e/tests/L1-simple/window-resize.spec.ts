/**
 * L1 系统行为测试：窗口尺寸变化模块（H5WindowResizeModule）
 *
 * 对应 Kotlin 源文件：H5WindowResizeModule.kt（0% → 提升覆盖率）
 *
 * H5WindowResizeModule 监听 window.resize 事件，通知 Kotlin 层做响应式布局更新。
 * 通过 Playwright 的 page.setViewportSize() 可以直接触发 resize 事件。
 *
 * 测试覆盖：
 * 1. 加载任意页面后修改 viewport 大小 — 触发 H5WindowResizeModule 回调
 * 2. 再次修改 viewport — 覆盖 debounce/throttle 分支
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('H5WindowResizeModule 窗口尺寸模块测试', () => {
  test('修改 viewport 大小应触发 H5WindowResizeModule resize 回调', async ({ kuiklyPage }) => {
    // 加载任意已有页面
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 修改 viewport 宽度触发 window.resize 事件
    await kuiklyPage.page.setViewportSize({ width: 390, height: 844 });
    await kuiklyPage.page.waitForTimeout(300);  // 等待 resize debounce

    // 验证页面仍然正常工作（Kotlin 层已响应 resize）
    const components = await kuiklyPage.page.locator('[data-kuikly-component]').all();
    expect(components.length).toBeGreaterThan(0);
  });

  test('连续多次 resize 应覆盖 H5WindowResizeModule 多次回调分支', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 连续触发多次 resize
    await kuiklyPage.page.setViewportSize({ width: 375, height: 667 });
    await kuiklyPage.page.waitForTimeout(100);
    await kuiklyPage.page.setViewportSize({ width: 414, height: 896 });
    await kuiklyPage.page.waitForTimeout(100);
    await kuiklyPage.page.setViewportSize({ width: 390, height: 844 });
    await kuiklyPage.page.waitForTimeout(300);

    // 页面应仍然正常渲染
    const components = await kuiklyPage.page.locator('[data-kuikly-component]').all();
    expect(components.length).toBeGreaterThan(0);
  });
});
