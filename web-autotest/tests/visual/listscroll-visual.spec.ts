import { test, expect } from '../../fixtures/test-base';

test.describe('list scroll 视觉验证', () => {
  test('visual regression for the initial state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('listscroll-test-initial.png', {
      maxDiffPixels: 800,
    });
  });

  test('visual regression after selecting an item', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('列表项 2', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('listscroll-test-selected.png', {
      maxDiffPixels: 800,
    });
  });
});
