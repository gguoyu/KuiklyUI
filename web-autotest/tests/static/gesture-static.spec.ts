import { test, expect } from '../../fixtures/test-base';

test.describe('Gesture static', () => {
  test('should load GestureTestPage and render all sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. Horizontal Scroll Pager', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. Tap Counter', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Long Press', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. Multi-Zone Tap', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. Status Panel', { exact: false })).toBeVisible();
  });

  test('long press area should show stable initial state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('long-press-area', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('long-press-status: inactive', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('hold ~500ms', { exact: false })).toBeVisible();
  });
});
