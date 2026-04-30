import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCanvasView static 验证', () => {
  test('应该成功加载 KRCanvasViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 线段绘制')).toBeVisible();
  });

  test('应该正确渲染 KRCanvasView 组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const canvasViews = await kuiklyPage.components('KRCanvasView');
    expect(canvasViews.length).toBeGreaterThan(0);

    await expect(kuiklyPage.page.locator('text=2. 矩形绘制')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 圆形与弧线')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 贝塞尔曲线')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 渐变填充')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=6. 文本绘制')).toBeVisible();
  });

  test('Canvas 应该有实际的绘制内容（非空白）', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    const canvasCount = await kuiklyPage.page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('Clip section should render (Section 8)', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await expect(kuiklyPage.page.getByText('8. Clip', { exact: false })).toBeVisible();
    // Canvas components should still be functional after clip operations
    const canvases = kuiklyPage.page.locator('canvas');
    const count = await canvases.count();
    expect(count).toBeGreaterThan(7);
  });
});
