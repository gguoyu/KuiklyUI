import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCalendarModule precise assertions', () => {
  test('timestampToCalendar should resolve to the expected date', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('timestampToCalendar', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('calendar:2024-10-1', { exact: true })).toBeVisible();
  });

  test('calendarToTimestamp should resolve to the expected epoch milliseconds', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('calendarToTimestamp', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('timestamp:1727742600100', { exact: true })).toBeVisible();
  });

  test('addCalendar should apply month and minute additions to the sample timestamp', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('addCalendar', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('added:2025-1-1', { exact: true })).toBeVisible();
  });

  test('formatTimestamp should format the sample timestamp with millisecond precision', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('formatTimestamp', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('formatted:2024-10-01 08:30:00.100', { exact: true })).toBeVisible();
  });

  test('multiple calendar operations should keep each result stable on the same page', async ({ kuiklyPage }) => {
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
