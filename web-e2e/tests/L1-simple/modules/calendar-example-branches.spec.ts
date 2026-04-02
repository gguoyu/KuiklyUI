import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCalendarModule branch verification', () => {
  test('calendar module example branches should stay stable on the current CalendarModuleTestPage', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('timestampToCalendar', { exact: true }).click();
    await kuiklyPage.page.getByText('calendarToTimestamp', { exact: true }).click();
    await kuiklyPage.page.getByText('addCalendar', { exact: true }).click();
    await kuiklyPage.page.getByText('formatTimestamp', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('calendar:2024-10-1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('timestamp:1727742600100', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('added:2025-1-1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('formatted:2024-10-01 08:30:00.100', { exact: true })).toBeVisible();
  });
});
