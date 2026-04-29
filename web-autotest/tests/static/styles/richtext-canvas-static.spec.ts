import { test, expect } from '../../../fixtures/test-base';

test.describe('RichTextCanvasTestPage static', () => {
  test('should render all sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RichTextCanvasTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('RichText Canvas & Advanced', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('1. Stroke Text', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. Word Wrapping', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Placeholder Span', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. LetterSpacing Multi-line', { exact: false })).toBeVisible();
  });

  test('should toggle stroke and wrap', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RichTextCanvasTestPage');
    await kuiklyPage.waitForRenderComplete();

    const strokeBtn = kuiklyPage.page.getByText('Toggle Stroke', { exact: false }).first();
    await expect(strokeBtn).toBeVisible();
    await strokeBtn.click();
    await kuiklyPage.page.waitForTimeout(300);

    const wrapBtn = kuiklyPage.page.getByText('Toggle Wrap', { exact: false }).first();
    await expect(wrapBtn).toBeVisible();
    await wrapBtn.click();
    await kuiklyPage.page.waitForTimeout(300);

    await expect(kuiklyPage.page.getByText('Stroked RichText Content', { exact: false })).toBeVisible();
  });
});
