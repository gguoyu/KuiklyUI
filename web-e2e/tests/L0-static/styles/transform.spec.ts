/**
 * L0 静态渲染测试：Transform 变换渲染验证
 *
 * 测试页面：TransformTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. Rotate 旋转不同角度
 * 3. Scale 缩放不同倍率
 * 4. Skew 倾斜
 * 5. 组合变换
 * 6. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('Transform 变换渲染测试', () => {
  test('应该成功加载 TransformTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. Rotate 旋转')).toBeVisible();
  });

  test('应该正确渲染旋转变换', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证旋转角度标签可见
    await expect(kuiklyPage.page.getByText('0°', { exact: true }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('45°', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('90°', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('180°', { exact: true })).toBeVisible();
  });

  test('应该正确渲染缩放变换', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证分区标题
    await expect(kuiklyPage.page.locator('text=2. Scale 缩放')).toBeVisible();

    // 验证缩放倍率标签
    await expect(kuiklyPage.page.getByText('0.5', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('1.0', { exact: true }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('1.5', { exact: true })).toBeVisible();
  });

  test('应该正确渲染倾斜和组合变换', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证分区标题
    await expect(kuiklyPage.page.locator('text=3. Skew 倾斜')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. Translate 平移')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 组合变换')).toBeVisible();

    // 验证组合变换标签
    await expect(kuiklyPage.page.getByText('R+S', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('R+K', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('S+K', { exact: true })).toBeVisible();
  });

  test('视觉回归：TransformTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('transform-test.png', {
      maxDiffPixels: 100,
    });
  });
});
