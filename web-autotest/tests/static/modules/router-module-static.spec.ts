import { test, expect } from '../../../fixtures/test-base';

test.describe('RouterModule static 验证', () => {
  test('should load RouterModuleTestPage and render buttons', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RouterModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Title visible
    await expect(kuiklyPage.page.getByText('RouterModuleTestPage', { exact: false })).toBeVisible();

    // Buttons visible
    await expect(kuiklyPage.page.getByText('Open Page (ClickTestPage)', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Close Page', { exact: false })).toBeVisible();
  });
});
