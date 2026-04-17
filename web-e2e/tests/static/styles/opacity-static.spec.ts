import { test, expect } from '../../../fixtures/test-base';

test.describe('Opacity static 验证', () => {
  test('应该成功加载 OpacityTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 透明度梯度')).toBeVisible();
  });

  test('应该正确渲染透明度梯度', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('0.8', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. 不同颜色透明度')).toBeVisible();
  });

  test('应该正确渲染文本透明度', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=3. 文本透明度')).toBeVisible();
    await expect(kuiklyPage.page.getByText('完全不透明文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('半透明文本', { exact: true })).toBeVisible();
  });

  test('应该正确渲染透明度叠加', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=4. 透明度叠加')).toBeVisible();
    await expect(kuiklyPage.page.getByText('父 opacity=0.5')).toBeVisible();
    await expect(kuiklyPage.page.getByText('子元素', { exact: true })).toBeVisible();
  });
});
