/**
 * L0 静态渲染测试：KRScrollContentView 滚动内容渲染验证
 * 
 * 测试页面：KRScrollContentViewTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 滚动容器组件渲染验证
 * 3. 垂直滚动内容
 * 4. 水平滚动内容
 * 5. 嵌套布局验证
 * 6. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRScrollContentView 渲染测试', () => {
  test('应该成功加载 KRScrollContentViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. 垂直滚动')).toBeVisible();
  });

  test('应该正确渲染滚动容器组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证 KRScrollView 或 KRScrollContentView 组件存在
    const scrollViews = await kuiklyPage.components('KRScrollView');
    const scrollContentViews = await kuiklyPage.components('KRScrollContentView');
    
    // 至少有一种滚动容器组件
    expect(scrollViews.length + scrollContentViews.length).toBeGreaterThan(0);

    console.log(`KRScrollContentViewTestPage 渲染了 ${scrollViews.length} 个 KRScrollView, ${scrollContentViews.length} 个 KRScrollContentView`);
  });

  test('应该正确渲染垂直滚动内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证垂直滚动项
    await expect(kuiklyPage.page.getByText('垂直项 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('垂直项 2', { exact: true })).toBeVisible();
  });

  test('应该正确渲染水平滚动内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证水平滚动项
    await expect(kuiklyPage.page.locator('text=2. 水平滚动')).toBeVisible();
    await expect(kuiklyPage.page.getByText('H1', { exact: true })).toBeVisible();
  });

  test('应该正确渲染嵌套布局', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证嵌套布局标题和内容
    await expect(kuiklyPage.page.locator('text=5. 嵌套布局验证')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=左侧滚动')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=右侧滚动')).toBeVisible();
  });

  test('视觉回归：KRScrollContentViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待页面完全渲染
    await kuiklyPage.page.waitForTimeout(500);

    // 视觉回归截图
    await expect(kuiklyPage.page).toHaveScreenshot('krscrollcontent-test.png', {
      maxDiffPixels: 200,
    });
  });
});
