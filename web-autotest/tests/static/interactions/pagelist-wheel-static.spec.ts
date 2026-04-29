import { test, expect } from '../../../fixtures/test-base';

test.describe('PageListWheelTestPage static', () => {
  test('should render horizontal page list', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('PageList Wheel Test', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 0', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 1', { exact: true })).toBeVisible();
  });

  test('should show page index indicator', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Verify the index indicator is visible
    await expect(kuiklyPage.page.getByText(/index:0/, { exact: false })).toBeVisible();

    // PageList wheel test is covered by functional test with wheel events
    // Drag-based page switching is unreliable in Playwright for this component
  });
});
