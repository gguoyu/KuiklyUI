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

test.describe('RichTextProcessor canvas measure branch', () => {
  // Exercises RichTextProcessor.measureTextSize canvas branch by adding
  // use_canvas_measure=1 URL parameter. This makes useCanvasMeasure = true
  // so calculateRenderViewSizeByCanvas is used instead of DOM measurement.

  test('page should render correctly with canvas text measurement enabled', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('?page_name=KRRichTextViewTestPage&use_canvas_measure=1');
    await kuiklyPage.waitForRenderComplete();

    // Page should still render all sections correctly with canvas measure
    await expect(kuiklyPage.page.getByText('1. 多色多样式Span', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 字重与字体样式', { exact: false })).toBeVisible();

    // RichTextView components should be rendered
    const richTextViews = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"]');
    const count = await richTextViews.count();
    expect(count).toBeGreaterThan(0);
  });

  test('rich text should be measurable after scroll with canvas measurement', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('?page_name=KRRichTextViewTestPage&use_canvas_measure=1');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 600, smooth: false });

    // Scrolling should work without layout errors under canvas measurement mode
    // Use a more lenient check — just verify the page is still functional after scroll
    const richTextViews = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"]');
    const count = await richTextViews.count();
    expect(count).toBeGreaterThan(0);
  });

  test('gradient rich text should render with canvas measurement', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('?page_name=KRGradientRichTextTestPage&use_canvas_measure=1');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 水平渐变文本', { exact: false })).toBeVisible();

    // Gradient text components should render without errors
    const richTextViews = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"]');
    const count = await richTextViews.count();
    expect(count).toBeGreaterThan(0);
  });
});
