/**
 * L0 静态渲染测试：Gradient 渐变渲染验证
 *
 * 测试页面：GradientTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 水平/垂直渐变方向标签可见
 * 3. 对角渐变方向箭头可见
 * 4. 多色渐变渲染
 * 5. 渐变+圆角组合
 * 6. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('Gradient 渐变渲染测试', () => {
  test('应该成功加载 GradientTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 水平渐变')).toBeVisible();
  });

  test('应该正确渲染水平和垂直渐变', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证方向标签可见
    await expect(kuiklyPage.page.getByText('TO_RIGHT', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('TO_LEFT', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('TO_BOTTOM', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('TO_TOP', { exact: true })).toBeVisible();
  });

  test('应该正确渲染对角渐变', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证对角渐变分区标题
    await expect(kuiklyPage.page.locator('text=3. 对角渐变')).toBeVisible();

    // 验证方向箭头标签可见
    await expect(kuiklyPage.page.getByText('↘', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('↙', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('↗', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('↖', { exact: true })).toBeVisible();
  });

  test('应该正确渲染多色渐变和渐变+圆角组合', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证分区标题
    await expect(kuiklyPage.page.locator('text=4. 多色渐变')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 渐变+圆角组合')).toBeVisible();

    // 验证多色渐变标签
    await expect(kuiklyPage.page.getByText('三色渐变', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('四色渐变', { exact: true })).toBeVisible();
  });

  test('视觉回归：GradientTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('gradient-test.png', {
      maxDiffPixels: 100,
    });
  });
});
