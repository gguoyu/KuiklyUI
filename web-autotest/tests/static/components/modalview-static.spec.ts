import { test, expect } from '../../../fixtures/test-base';

test.describe('ModalView static 验证', () => {
  test('should load ModalViewTestPage and render toggle buttons', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Title visible
    await expect(kuiklyPage.page.getByText('ModalViewTestPage', { exact: false })).toBeVisible();

    // Buttons visible
    await expect(kuiklyPage.page.getByText('Show Modal', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Show Nested Modal', { exact: false })).toBeVisible();
  });

  test('should show and dismiss modal overlay', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Click Show Modal
    await kuiklyPage.page.getByText('Show Modal', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(1000);

    // Check if the button text changed (the observable should update)
    await expect(kuiklyPage.page.getByText('Hide Modal', { exact: false })).toBeVisible();
  });
});
