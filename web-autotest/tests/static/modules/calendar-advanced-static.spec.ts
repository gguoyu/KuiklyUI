import { test, expect } from '../../../fixtures/test-base';

test.describe('CalendarAdvancedTestPage static', () => {
  test('should render all buttons', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarAdvancedTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Calendar Advanced', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('DAY_OF_YEAR add/set', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('MILLISECOND add/set', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('getTimeInMillis ops', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('parseFormat error', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('format quotes', { exact: false })).toBeVisible();
  });

  test('should execute calendar operations', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarAdvancedTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('DAY_OF_YEAR add/set', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/doy:/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('MILLISECOND add/set', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/ms:/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('getTimeInMillis ops', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/tim:/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('parseFormat error', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/parseErr:/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('format quotes', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/q:/, { exact: false })).toBeVisible();
  });
});
