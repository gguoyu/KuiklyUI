/**
 * L0 静态渲染测试：KRTextView 文本渲染验证
 * 
 * 测试页面：KRTextViewTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 文本内容正确显示
 * 3. 不同变体的视觉回归验证（字号/颜色/字重/对齐/截断/装饰/行高）
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRTextView 渲染测试', () => {
  test('应该成功加载 KRTextViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. 不同字号')).toBeVisible();
  });

  test('应该正确渲染不同字号的文本', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证不同字号的文本都可见
    await expect(kuiklyPage.page.locator('text=字号 10')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=字号 16')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=字号 24')).toBeVisible();
  });

  test('应该正确渲染不同颜色的文本', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证不同颜色的文本可见
    await expect(kuiklyPage.page.locator('text=红色文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=蓝色文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=绿色文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=紫色文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=橙色文本')).toBeVisible();
  });

  test('应该正确渲染文本装饰', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证文本装饰类型可见
    await expect(kuiklyPage.page.locator('text=下划线文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=删除线文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=斜体文本')).toBeVisible();
  });

  test('视觉回归：KRTextViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待页面完全渲染
    await kuiklyPage.page.waitForTimeout(500);

    // 视觉回归截图
    await expect(kuiklyPage.page).toHaveScreenshot('krtext-test.png', {
      maxDiffPixels: 100,
    });
  });
});
