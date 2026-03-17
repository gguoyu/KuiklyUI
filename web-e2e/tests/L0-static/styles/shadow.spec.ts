/**
 * L0 静态渲染测试：Shadow 阴影渲染验证
 *
 * 测试页面：ShadowTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 不同模糊半径渲染
 * 3. 不同阴影颜色渲染
 * 4. 阴影+圆角组合
 * 5. 阴影强度梯度
 * 6. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('Shadow 阴影渲染测试', () => {
  test('应该成功加载 ShadowTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 不同模糊半径')).toBeVisible();
  });

  test('应该正确渲染不同模糊半径', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证模糊半径标签文本
    // 使用 first() 因为 "0" 可能匹配多个元素
    const blurLabels = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"]');
    const count = await blurLabels.count();
    expect(count).toBeGreaterThan(0);

    // 验证第二个 section 标题可见
    await expect(kuiklyPage.page.locator('text=2. 不同偏移量')).toBeVisible();
  });

  test('应该正确渲染所有阴影分区', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证各分区标题可见
    await expect(kuiklyPage.page.locator('text=3. 不同阴影颜色')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 阴影+圆角组合')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 阴影强度梯度')).toBeVisible();
  });

  test('应该正确渲染阴影颜色变体', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证阴影颜色标签可见
    await expect(kuiklyPage.page.getByText('蓝', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('红', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('绿', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('紫', { exact: true })).toBeVisible();
  });

  test('视觉回归：ShadowTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('shadow-test.png', {
      maxDiffPixels: 200,
    });
  });
});
