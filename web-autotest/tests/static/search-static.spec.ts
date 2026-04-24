import { test, expect } from '../../fixtures/test-base';

test.describe('SearchTestPage static', () => {
  test('should load SearchTestPage with full list', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('total: 20')).toBeVisible();
    await expect(kuiklyPage.page.getByPlaceholder('search...')).toBeVisible();
    await expect(kuiklyPage.page.getByText('Apple')).toBeVisible();
    await expect(kuiklyPage.page.getByText('Banana')).toBeVisible();
  });
});
