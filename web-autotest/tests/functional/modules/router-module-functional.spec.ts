import { test, expect } from '../../../fixtures/test-base';

test.describe('RouterModule functional 验证', () => {
  test('should render RouterModuleTestPage with action buttons', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RouterModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('RouterModuleTestPage', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Open Page (ClickTestPage)', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Close Page', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('log: idle', { exact: false })).toBeVisible();
  });

  test('clicking Open Page should call RouterModule.openPage', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RouterModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Click the open page button — KRRouterModule.openPage will be triggered
    // It tries to open a new window, which Playwright may block, but the h5 code path is exercised
    await kuiklyPage.page.getByText('Open Page (ClickTestPage)', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    // Verify log updated (the click handler updates it regardless of window.open success)
    await expect(kuiklyPage.page.getByText('log: openPage called', { exact: false })).toBeVisible();
  });

  test('clicking Close Page should call RouterModule.closePage', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RouterModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('Close Page', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('log: closePage called', { exact: false })).toBeVisible();
  });
});
