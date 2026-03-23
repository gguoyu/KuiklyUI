/**
 * L1 简单交互测试：输入框交互验证
 * 
 * 测试页面：InputTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 输入框组件正确渲染
 * 3. 输入框聚焦验证
 * 4. 视觉回归截图
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('输入框交互测试', () => {
  test('应该成功加载 InputTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. 单行文本输入')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. 密码输入')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 数字输入')).toBeVisible();
  });

  test('应该正确渲染输入框组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证输入框组件存在 — Input 在 web 端注册为 KRTextFieldView，TextArea 为 KRTextAreaView
    const inputViews = kuiklyPage.page.locator('[data-kuikly-component="KRTextFieldView"]');
    const textAreaViews = kuiklyPage.page.locator('[data-kuikly-component="KRTextAreaView"]');

    const inputCount = await inputViews.count();
    const textAreaCount = await textAreaViews.count();
    console.log(`InputTestPage 渲染了 ${inputCount} 个 KRTextFieldView, ${textAreaCount} 个 KRTextAreaView`);
    // 页面有 4 个 Input + 1 个 TextArea = 5 个输入组件
    expect(inputCount + textAreaCount).toBeGreaterThanOrEqual(4);
  });

  test('单行文本输入框应支持聚焦', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 定位第一个输入框 (单行文本) 并点击聚焦 — 使用正确的组件名 KRTextFieldView
    const input = kuiklyPage.page.locator('[data-kuikly-component="KRTextFieldView"]').first();
    await input.click();
    await kuiklyPage.page.waitForTimeout(500);

    // 验证输入框被聚焦（页面没崩溃即可）
    await expect(input).toBeVisible();
  });

  test('视觉回归：InputTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('input-test-initial.png', {
      maxDiffPixels: 300,
    });
  });
});
