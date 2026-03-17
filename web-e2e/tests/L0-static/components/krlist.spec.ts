/**
 * L0 静态渲染测试：KRListView 列表渲染验证（静态版）
 * 
 * 测试页面：KRListViewTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 列表项正确渲染
 * 3. 列表项内容正确显示
 * 4. 列表的视觉回归验证
 * 
 * 注意：此测试为 L0 静态测试，不涉及滚动操作
 *       滚动测试在 L2 复杂交互测试中进行
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRListView 静态渲染测试', () => {
  test('应该成功加载 KRListViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRListViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=列表渲染测试')).toBeVisible();
  });

  test('应该正确渲染列表项内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRListViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证列表项标题可见（至少前几项应在可视区域内）
    // 使用 exact 匹配避免 "列表项 1" 同时匹配到 "列表项 10"
    await expect(kuiklyPage.page.getByText('列表项 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 2', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 3', { exact: true })).toBeVisible();

    // 验证列表项描述文字
    await expect(kuiklyPage.page.locator('text=这是第一个列表项的描述文字')).toBeVisible();
  });

  test('应该渲染正确数量的列表组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRListViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证 KRListView 容器存在
    const listViews = await kuiklyPage.components('KRListView');
    expect(listViews.length).toBeGreaterThan(0);

    console.log(`KRListViewTestPage 渲染了 ${listViews.length} 个 KRListView 组件`);
  });

  test('视觉回归：KRListViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRListViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待页面完全渲染
    await kuiklyPage.page.waitForTimeout(500);

    // 视觉回归截图
    await expect(kuiklyPage.page).toHaveScreenshot('krlist-static.png', {
      maxDiffPixels: 100,
    });
  });
});
