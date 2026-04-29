import { test, expect } from '../../../fixtures/test-base';

test.describe('CalendarAdvancedTestPage functional', () => {
  test('should execute all calendar operations', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarAdvancedTestPage');
    await kuiklyPage.waitForRenderComplete();

    // DAY_OF_YEAR
    await kuiklyPage.page.getByText('DAY_OF_YEAR add/set', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/doy:\d+/, { exact: false })).toBeVisible();

    // MILLISECOND
    await kuiklyPage.page.getByText('MILLISECOND add/set', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/ms:\d+/, { exact: false })).toBeVisible();

    // getTimeInMillis
    await kuiklyPage.page.getByText('getTimeInMillis ops', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/tim:\d+/, { exact: false })).toBeVisible();

    // parseFormat error
    await kuiklyPage.page.getByText('parseFormat error', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/parseErr:/, { exact: false })).toBeVisible();

    // format quotes
    await kuiklyPage.page.getByText('format quotes', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/q:/, { exact: false })).toBeVisible();
  });
});
