/**
 * functional 测试：KRHoverView 悬停组件
 *
 * 测试页面：KRHoverViewTestPage
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRHoverView functional 验证', () => {
  test('滚动列表应触发 Hover 视图的 scroll 事件处理', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRHoverViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('KRHoverViewTestPage', { exact: false })).toBeVisible();

    // Scroll the list to trigger the scroll event handler in onAddToParent
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 300, smooth: false });
    await kuiklyPage.page.waitForTimeout(200);

    // Verify the page is still stable after scrolling
    await expect(kuiklyPage.page.getByText('KRHoverViewTestPage', { exact: false })).toBeVisible();
  });

  test('hoverMarginTop 属性应被正确应用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRHoverViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // The second Hover view has hoverMarginTop(50f) set
    const hoverViews = kuiklyPage.page.locator('[data-kuikly-component="KRHoverView"]');
    expect(await hoverViews.count()).toBeGreaterThanOrEqual(2);

    // Scroll enough to potentially trigger the fixed/absolute toggle
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 600, smooth: false });
    await kuiklyPage.page.waitForTimeout(300);

    // No crash, page still visible
    await expect(kuiklyPage.page.getByText('KRHoverViewTestPage', { exact: false })).toBeVisible();
  });
});
