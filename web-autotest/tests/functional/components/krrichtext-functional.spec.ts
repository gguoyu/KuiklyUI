import { test, expect } from '../../../fixtures/test-base';

test.describe('KRRichTextViewTestPage functional', () => {
  test('page should render rich text sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 多色多样式Span', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 字重与字体样式', { exact: false })).toBeVisible();
  });

  test('Span text effects section should be reachable after scroll', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1600, smooth: false });

    await expect(kuiklyPage.page.getByText('10. Span Text Effects', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('Gradient text section should be reachable after scroll', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1800, smooth: false });

    await expect(kuiklyPage.page.getByText('11. Gradient Text', { exact: false })).toBeVisible({ timeout: 5000 });
  });
});
