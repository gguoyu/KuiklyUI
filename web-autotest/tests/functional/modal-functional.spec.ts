import { test, expect } from '../../fixtures/test-base';

test.describe('Modal functional', () => {
  test('clicking show-custom-modal should display the custom modal', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('custom-modal-result: none')).toBeVisible();

    await kuiklyPage.page.getByText('show-custom-modal').click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(1000);

    await expect(kuiklyPage.page.getByText('custom-modal')).toBeVisible();
  });

  test('confirming the custom modal should update the result label', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('show-custom-modal').click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await kuiklyPage.page.getByText('confirm', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('custom-modal-result: confirmed')).toBeVisible();
  });
});
