/**
 * L0 静态渲染测试：KRView 基础渲染验证
 * 
 * 测试页面：KRViewTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. KRView 组件正确渲染
 * 3. 不同变体的视觉回归验证（尺寸/背景色/圆角/边框/渐变/嵌套/Flex布局）
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRView 渲染测试', () => {
  test('应该成功加载 KRViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. 不同尺寸')).toBeVisible();
  });

  test('应该正确渲染多种样式的 KRView 组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证 KRView 组件数量大于 0
    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);

    // 验证各节标题可见（证明布局正确渲染）
    await expect(kuiklyPage.page.locator('text=2. 不同背景色')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 不同圆角')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 边框样式')).toBeVisible();

    console.log(`KRViewTestPage 渲染了 ${views.length} 个 KRView 组件`);
  });

  test('视觉回归：KRViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待页面完全渲染
    await kuiklyPage.page.waitForTimeout(500);

    // 视觉回归截图
    await expect(kuiklyPage.page).toHaveScreenshot('krview-test.png', {
      maxDiffPixels: 100,
    });
  });
});
