import { test, expect } from '../../fixtures/test-base';

test.describe('FormTestPage static', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('FormTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('should load FormTestPage and render all field labels', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('User Info Form', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Fields marked * are required', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('* Name', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('* Email', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Phone', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Note', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Subscribe to updates', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('I agree to the terms', { exact: false })).toBeVisible();
  });

  test('submit button should be grey initially (terms not agreed)', async ({ kuiklyPage }) => {
    const bg = await kuiklyPage.page.evaluate(() => {
      const els = document.querySelectorAll('[data-kuikly-component="KRView"]');
      for (const el of Array.from(els)) {
        const htmlEl = el as HTMLElement;
        if (htmlEl.innerText?.trim() === 'submit') {
          return window.getComputedStyle(htmlEl).backgroundColor;
        }
      }
      return '';
    });
    expect(bg).toMatch(/187|190|184|bbb/i);
  });
});
