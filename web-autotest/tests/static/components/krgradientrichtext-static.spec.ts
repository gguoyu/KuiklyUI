import { test, expect } from '../../../fixtures/test-base';

test.describe('KRGradientRichTextView static 验证', () => {
  test('应该渲染渐变富文本页面和确定性内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 水平渐变文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 垂直渐变文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. 对角渐变文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. 多色渐变文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('水平渐变效果 Horizontal Gradient', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('垂直渐变效果 Vertical Gradient', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('三色彩虹渐变效果 Rainbow', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('四色渐变效果 Multicolor', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('小字号渐变 12', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('大字号渐变 28', { exact: true })).toBeVisible();

    const gradientTexts = await kuiklyPage.components('KRGradientRichTextView');
    expect(gradientTexts.length).toBeGreaterThan(0);
  });
});
