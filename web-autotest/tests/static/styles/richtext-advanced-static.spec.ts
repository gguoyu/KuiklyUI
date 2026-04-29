import { test, expect } from '../../../fixtures/test-base';

test.describe('RichTextAdvanced static 验证', () => {
  test('should load RichTextAdvancedTestPage and render all sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RichTextAdvancedTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Verify section titles are visible
    await expect(kuiklyPage.page.getByText('1. PlaceholderSpan', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. Span fontFamily', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Span headIndent', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. Excess Declared Lines', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. Single-line RichText', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('6. LetterSpacing Multi-line', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('7. Mixed Style Spans', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('8. Span lineHeight', { exact: false })).toBeVisible();

    // Verify PlaceholderSpan rendered text content around the placeholder
    await expect(kuiklyPage.page.getByText('before-placeholder', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('after-placeholder', { exact: false })).toBeVisible();

    // Verify fontFamily spans rendered
    await expect(kuiklyPage.page.getByText('monospace-font', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('serif-font', { exact: false })).toBeVisible();

    // Verify mixed style content
    await expect(kuiklyPage.page.getByText('bold-red', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('italic', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('underline', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('stroked', { exact: false })).toBeVisible();
  });
});
