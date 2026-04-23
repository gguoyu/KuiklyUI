import { test, expect } from '../../../fixtures/test-base';

test.describe('KRView 静态验证', () => {
  test('应该成功加载 KRViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 不同尺寸')).toBeVisible();
  });

  test('应该正确渲染多种样式的 KRView 组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);

    await expect(kuiklyPage.page.locator('text=2. 不同背景色')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 不同圆角')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 边框样式')).toBeVisible();
  });
});
