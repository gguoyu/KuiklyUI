import { test, expect } from '../../../fixtures/test-base';

test.describe('KRHoverView static 验证', () => {
  test('应该渲染 KRHoverView 页面和组件结构', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRHoverViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('KRHoverViewTestPage', { exact: true })).toBeVisible();

    const componentCount = await kuiklyPage.page.locator('[data-kuikly-component]').count();
    expect(componentCount).toBeGreaterThan(0);
  });
});
