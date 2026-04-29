import { test, expect } from '../../../fixtures/test-base';

test.describe('Components functional smoke', () => {
  test('KRImageView: invalid src should trigger loadFailure callback', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Load Failure', { exact: false })).toBeVisible();

    // DNS resolution for invalid.example.test may take a long time.
    // Use extended timeout to allow the image error event + Kuikly callback chain to complete.
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /load-failure-count:(?!0)/ }).first())
      .toBeVisible({ timeout: 30000 });
  });

  test('KRTextFieldView: textLengthBeyondLimit callback fires when exceeding max length', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextFieldViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Text Length Limit Callback', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('beyond-limit-count:0', { exact: false })).toBeVisible();

    const limitedInput = kuiklyPage.page.locator('input[placeholder="max 5 chars"]').first();
    await expect(limitedInput).toBeVisible();

    await limitedInput.click();
    await limitedInput.fill('abcdef');
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /beyond-limit-count:(?!0)/ }).first())
      .toBeVisible({ timeout: 5000 });
  });

  test('KRBlurView: blurRadius should apply backdrop-filter', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRBlurViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Blur Component (KRBlurView)', { exact: false })).toBeVisible();

    const blurElement = kuiklyPage.page.locator('[data-kuikly-component="KRBlurView"]');
    await expect(blurElement.first()).toBeVisible();

    const backdropFilter = await blurElement.first().evaluate((el) => {
      return window.getComputedStyle(el).backdropFilter || window.getComputedStyle(el).webkitBackdropFilter;
    });
    expect(backdropFilter).toContain('blur');
  });

  test('KRCanvasView: Line Cap section should render multiple canvas elements', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await expect(kuiklyPage.page.getByText('7. Line Cap', { exact: false })).toBeVisible();

    const canvasElements = kuiklyPage.page.locator('canvas');
    expect(await canvasElements.count()).toBeGreaterThanOrEqual(7);
  });
});
