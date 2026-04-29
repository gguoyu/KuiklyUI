/**
 * functional 测试：KRCanvasView 画布组件
 *
 * 测试页面：KRCanvasViewTestPage
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCanvasView functional 验证', () => {
  test('Line Cap 区域应正确渲染不同线帽样式', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await expect(kuiklyPage.page.getByText('7. Line Cap', { exact: false })).toBeVisible();

    // Verify canvas elements exist for the line cap section
    const canvasElements = kuiklyPage.page.locator('canvas');
    expect(await canvasElements.count()).toBeGreaterThanOrEqual(7);
  });
});
