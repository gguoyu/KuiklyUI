import { test, expect } from '../../../fixtures/test-base';

test.describe('Auto KRGradientRichTextTestPage static 验证', () => {
  test('should render KRGradientRichTextTestPage stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRGradientRichTextTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 水平渐变文本').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('水平渐变效果 Horizontal Gradient').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
