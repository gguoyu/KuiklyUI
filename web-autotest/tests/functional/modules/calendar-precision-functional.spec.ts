import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCalendarModule functional precise assertions', () => {
  test('timestampToCalendar 应得到预期日期', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('timestampToCalendar', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('calendar:2024-10-1', { exact: true })).toBeVisible();
  });

  test('calendarToTimestamp 应得到预期毫秒时间戳', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('calendarToTimestamp', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('timestamp:1727742600100', { exact: true })).toBeVisible();
  });

  test('addCalendar 应对示例时间应用月份和分钟增量', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('addCalendar', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('added:2025-1-1', { exact: true })).toBeVisible();
  });

  test('formatTimestamp 应输出毫秒精度格式化结果', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('formatTimestamp', { exact: true }).click();

    await expect(kuiklyPage.page.getByText('formatted:2024-10-01 08:30:00.100', { exact: true })).toBeVisible();
  });

  test('多个日历操作在同页执行后应保持结果稳定', async ({ kuiklyPage }) => {
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
