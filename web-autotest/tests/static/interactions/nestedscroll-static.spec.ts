import { test, expect } from '../../../fixtures/test-base';

test.describe('nested scroll static 验证', () => {
  test('应该成功加载 NestedScrollTestPage 页面并渲染嵌套列表', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NestedScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Title visible
    await expect(kuiklyPage.page.getByText('Nested Scroll Test Page', { exact: true })).toBeVisible();

    // Section headers visible
    await expect(kuiklyPage.page.getByText('Section 1: PARENT_FIRST / SELF_ONLY', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Section 2: SELF_FIRST / SELF_FIRST (no bounce)', { exact: false })).toBeVisible();

    // Inner list items visible (use .first() — 3 sections each have "Inner Item 1")
    await expect(kuiklyPage.page.getByText('Inner Item 1', { exact: true }).first()).toBeVisible();

    // Animated scroll button visible
    await expect(kuiklyPage.page.getByText('Scroll Inner (animated)', { exact: false })).toBeVisible();

    // Outer list content items visible
    await expect(kuiklyPage.page.getByText('Content Item 1', { exact: true })).toBeVisible();

    // KRListView components rendered (at least outer + 3 inner lists)
    const listViews = kuiklyPage.component('KRListView');
    const count = await listViews.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});
