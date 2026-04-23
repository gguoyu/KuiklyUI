import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCalendarModule static 验证', () => {
  test('应该成功加载 CalendarModuleTestPage 页面并展示稳定入口', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('CalendarModuleTestPage', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('timestampToCalendar', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('calendarToTimestamp', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('addCalendar', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('formatTimestamp', { exact: true })).toBeVisible();
  });
});
