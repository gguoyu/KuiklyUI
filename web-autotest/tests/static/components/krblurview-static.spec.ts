import { test, expect } from '../../../fixtures/test-base';

test.describe('KRBlurView static 验证', () => {
  test('应成功加载 KRBlurViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRBlurViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('KRBlurViewTestPage', { exact: false })).toBeVisible();
  });

  test('KRBlurView 页面应渲染组件节点', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRBlurViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const componentCount = await kuiklyPage.page.locator('[data-kuikly-component]').count();
    expect(componentCount).toBeGreaterThan(0);
  });
});
