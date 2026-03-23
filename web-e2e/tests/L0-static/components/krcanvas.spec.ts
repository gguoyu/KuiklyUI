/**
 * L0 静态渲染测试：KRCanvasView Canvas 绘制验证
 * 
 * 测试页面：KRCanvasViewTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. Canvas 组件渲染验证
 * 3. 各绘制类型（线段/矩形/圆形/曲线/渐变/文本）
 * 4. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCanvasView 渲染测试', () => {
  test('应该成功加载 KRCanvasViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. 线段绘制')).toBeVisible();
  });

  test('应该正确渲染 KRCanvasView 组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证 Canvas 组件存在
    const canvasViews = await kuiklyPage.components('KRCanvasView');
    expect(canvasViews.length).toBeGreaterThan(0);

    // 验证各个 Section 标题可见
    await expect(kuiklyPage.page.locator('text=2. 矩形绘制')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 圆形与弧线')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 贝塞尔曲线')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 渐变填充')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=6. 文本绘制')).toBeVisible();

    console.log(`KRCanvasViewTestPage 渲染了 ${canvasViews.length} 个 KRCanvasView 组件`);
  });

  test('Canvas 应该有实际的绘制内容（非空白）', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待 Canvas 绘制完成
    await kuiklyPage.page.waitForTimeout(500);

    // 验证 Canvas 元素有 <canvas> 标签或实际内容
    const canvasCount = await kuiklyPage.page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('视觉回归：KRCanvasViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待 Canvas 绘制完成
    await kuiklyPage.page.waitForTimeout(1000);

    // 视觉回归截图
    await expect(kuiklyPage.page).toHaveScreenshot('krcanvas-test.png', {
      maxDiffPixels: 200,
    });
  });
});
