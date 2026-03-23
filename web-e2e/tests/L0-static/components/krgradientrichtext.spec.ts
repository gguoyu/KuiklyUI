/**
 * L0 静态渲染测试：KRGradientRichTextView 渐变富文本渲染验证
 * 
 * 测试页面：KRGradientRichTextTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 渐变文本组件渲染验证
 * 3. 各方向渐变（水平/垂直/对角）
 * 4. 多色渐变
 * 5. 渐变 + 不同字号/粗体
 * 6. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRGradientRichTextView 渲染测试', () => {
  test('应该成功加载 KRGradientRichTextTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. 水平渐变文本')).toBeVisible();
  });

  test('应该正确渲染渐变文本组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证 KRGradientRichTextView 组件存在
    const gradientTexts = await kuiklyPage.components('KRGradientRichTextView');
    expect(gradientTexts.length).toBeGreaterThan(0);

    console.log(`KRGradientRichTextTestPage 渲染了 ${gradientTexts.length} 个渐变文本组件`);
  });

  test('应该正确渲染各方向渐变文本', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证各 Section 标题可见
    await expect(kuiklyPage.page.locator('text=2. 垂直渐变文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 对角渐变文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 多色渐变文本')).toBeVisible();

    // 验证渐变文本内容
    await expect(kuiklyPage.page.locator('text=水平渐变效果 Horizontal Gradient')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=垂直渐变效果 Vertical Gradient')).toBeVisible();
  });

  test('应该正确渲染多色渐变文本', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证多色渐变文本
    await expect(kuiklyPage.page.locator('text=三色彩虹渐变效果 Rainbow')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=四色渐变效果 Multicolor')).toBeVisible();
  });

  test('应该正确渲染渐变+不同字号', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证不同字号的渐变文本
    await expect(kuiklyPage.page.locator('text=小字号渐变 12')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=大字号渐变 28')).toBeVisible();
  });

  test('视觉回归：KRGradientRichTextTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待页面完全渲染
    await kuiklyPage.page.waitForTimeout(500);

    // 视觉回归截图
    await expect(kuiklyPage.page).toHaveScreenshot('krgradientrichtext-test.png', {
      maxDiffPixels: 200,
    });
  });
});
