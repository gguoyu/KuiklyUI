/**
 * L0 静态渲染测试：KRRichTextView 富文本渲染验证
 * 
 * 测试页面：KRRichTextViewTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 多色多样式 Span 渲染
 * 3. 字重与字体样式
 * 4. 文本装饰（下划线/删除线）
 * 5. 不同字号混排
 * 6. ImageSpan 图文混排
 * 7. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRRichTextView 渲染测试', () => {
  test('应该成功加载 KRRichTextViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. 多色多样式Span')).toBeVisible();
  });

  test('应该正确渲染多色多样式 Span', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证各种颜色的文本可见（页面中存在多个匹配项，使用 first() 取第一个）
    await expect(kuiklyPage.page.getByText('普通文本').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('红色文本').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('蓝色文本').first()).toBeVisible();
  });

  test('应该正确渲染字重与字体样式', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证字重相关文本
    await expect(kuiklyPage.page.locator('text=粗体字重')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=斜体文本')).toBeVisible();
  });

  test('应该正确渲染文本装饰', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证文本装饰
    await expect(kuiklyPage.page.locator('text=下划线文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=删除线文本')).toBeVisible();
  });

  test('应该正确渲染不同字号混排', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证不同字号的文本
    await expect(kuiklyPage.page.locator('text=10号字')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=28号字')).toBeVisible();
  });

  test('应该正确渲染 ImageSpan 图文混排', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待图片加载
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(500);

    // 验证图文混排文本
    await expect(kuiklyPage.page.locator('text=文本前嵌入图片')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=图片后文本')).toBeVisible();
  });

  test('视觉回归：KRRichTextViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 等待图片加载完成
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(1000);

    // 视觉回归截图
    await expect(kuiklyPage.page).toHaveScreenshot('krrichtext-test.png', {
      maxDiffPixels: 300,
    });
  });
});
