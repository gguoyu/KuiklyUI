/**
 * L0 静态渲染测试：Opacity 透明度渲染验证
 *
 * 测试页面：OpacityTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 透明度梯度渲染正确
 * 3. 文本透明度
 * 4. 透明度叠加（父子元素）
 * 5. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('Opacity 透明度渲染测试', () => {
  test('应该成功加载 OpacityTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 透明度梯度')).toBeVisible();
  });

  test('应该正确渲染透明度梯度', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证梯度标签可见（opacity=1.0 的元素肯定可见）
    // 注意：opacity=0 的元素不可见是预期行为
    await expect(kuiklyPage.page.getByText('0.8', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. 不同颜色透明度')).toBeVisible();
  });

  test('应该正确渲染文本透明度', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证分区标题
    await expect(kuiklyPage.page.locator('text=3. 文本透明度')).toBeVisible();

    // 验证不同透明度文本可见（完全不透明文本一定可见）
    await expect(kuiklyPage.page.getByText('完全不透明文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('半透明文本', { exact: true })).toBeVisible();
  });

  test('应该正确渲染透明度叠加', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证分区标题
    await expect(kuiklyPage.page.locator('text=4. 透明度叠加')).toBeVisible();

    // 验证父元素内的文字存在（DOM 中存在，但视觉上半透明）
    await expect(kuiklyPage.page.getByText('父 opacity=0.5')).toBeVisible();
    await expect(kuiklyPage.page.getByText('子元素', { exact: true })).toBeVisible();
  });

  test('视觉回归：OpacityTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OpacityTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('opacity-test.png', {
      maxDiffPixels: 100,
    });
  });
});
