import { test, expect } from '../../fixtures/test-base';

test.describe('Modal static', () => {
  test('should load ModalTestPage and render all sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. AlertDialog')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. ActionSheet')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. Custom Modal')).toBeVisible();
  });

  test('should render all trigger buttons in initial state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('show-alert', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('show-action-sheet', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('show-custom-modal', { exact: false })).toBeVisible();

    const noneTexts = kuiklyPage.page.getByText('none', { exact: false });
    expect(await noneTexts.count()).toBeGreaterThanOrEqual(3);
  });
});
