/**
 * L0 静态渲染测试：Border / BorderRadius 渲染验证
 *
 * 测试页面：BorderTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 不同边框宽度正确渲染
 * 3. 不同边框样式（solid/dashed/dotted）可见
 * 4. 统一圆角和不等圆角渲染
 * 5. 边框+背景色组合渲染
 * 6. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('Border / BorderRadius 渲染测试', () => {
  test('应该成功加载 BorderTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面第一个标题存在
    await expect(kuiklyPage.page.locator('text=1. 不同边框宽度')).toBeVisible();
  });

  test('应该正确渲染不同边框宽度', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证各宽度标签文本可见
    await expect(kuiklyPage.page.getByText('1px', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2px', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4px', { exact: true })).toBeVisible();
  });

  test('应该正确渲染不同边框样式', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证样式标签可见
    await expect(kuiklyPage.page.getByText('solid', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('dashed', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('dotted', { exact: true })).toBeVisible();
  });

  test('应该正确渲染所有样式分区', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证各分区标题可见
    await expect(kuiklyPage.page.locator('text=2. 不同边框样式')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 不同边框颜色')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 统一圆角')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 不等圆角')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=6. 边框+圆角组合')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=7. 边框+背景色')).toBeVisible();

    // 验证 KRView 组件数量
    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);
    console.log(`BorderTestPage 渲染了 ${views.length} 个 KRView 组件`);
  });

  test('视觉回归：BorderTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('border-test.png', {
      maxDiffPixels: 100,
    });
  });
});
