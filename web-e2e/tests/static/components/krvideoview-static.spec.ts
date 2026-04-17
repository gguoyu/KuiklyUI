import { test, expect } from '../../../fixtures/test-base';

test.describe('KRVideoView static 验证', () => {
  test('应该渲染 KRVideoView 页面和组件结构', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('KRVideoViewTestPage', { exact: true })).toBeVisible();

    const componentCount = await kuiklyPage.page.locator('[data-kuikly-component]').count();
    expect(componentCount).toBeGreaterThan(0);
  });
});
