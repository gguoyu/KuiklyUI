import { test, expect } from '../../../fixtures/test-base';

test.describe('Auto KRRichTextViewTestPage static 验证', () => {
  test('should render KRRichTextViewTestPage stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 多色多样式Span').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('普通文本').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
