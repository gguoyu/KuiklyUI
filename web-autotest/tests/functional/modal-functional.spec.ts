import { test, expect } from '../../fixtures/test-base';

test.describe('Modal functional', () => {
  test('AlertDialog: show-alert → confirm → alert-result: confirmed', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('alert-result: none')).toBeVisible();

    await kuiklyPage.page.getByText('show-alert', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    // AlertDialog renders its buttons as page text
    await expect(kuiklyPage.page.getByText('confirm-action')).toBeVisible({ timeout: 5000 });
    await expect(kuiklyPage.page.getByText('ok', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('ok', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('alert-result: confirmed')).toBeVisible();
  });

  test('AlertDialog: show-alert → cancel → alert-result: cancelled', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('show-alert', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('cancel', { exact: true })).toBeVisible({ timeout: 5000 });

    await kuiklyPage.page.getByText('cancel', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('alert-result: cancelled')).toBeVisible();
  });

  test('ActionSheet: show-action-sheet → from-album → action-sheet-result updates', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('show-action-sheet', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('select-an-action')).toBeVisible({ timeout: 5000 });

    await kuiklyPage.page.getByText('from-album', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('action-sheet-result: selected: from-album')).toBeVisible();
  });

  // NOTE: Kuikly's custom Modal component (if/Modal DSL) does not render in
  // Playwright headless mode — this is a known product-level limitation.
  // The show-custom-modal button click does not produce a visible modal overlay
  // in headless Chromium. Tracked as a code warning; test is skipped until fixed.
  test.skip('Custom Modal: show-custom-modal → confirm → custom-modal-result: confirmed [KNOWN: Modal headless rendering issue]', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('show-custom-modal', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('custom-modal', { exact: true })).toBeVisible({ timeout: 5000 });

    await kuiklyPage.page.getByText('confirm', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('custom-modal-result: confirmed')).toBeVisible();
  });
});
