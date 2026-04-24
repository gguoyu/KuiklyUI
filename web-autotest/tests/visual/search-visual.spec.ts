import { test, expect } from '../../fixtures/test-base';

test.describe('SearchTestPage visual', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('visual regression: SearchTestPage initial state', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page).toHaveScreenshot('search-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('visual regression: SearchTestPage filtered by berry', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('search...');
    await input.fill('berry');
    await kuiklyPage.page.getByText('search').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('search-test-filtered.png', {
      maxDiffPixels: 300,
    });
  });

  test('visual regression: SearchTestPage after item selected', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('Mango').first().click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('search-test-item-selected.png', {
      maxDiffPixels: 300,
    });
  });
});
