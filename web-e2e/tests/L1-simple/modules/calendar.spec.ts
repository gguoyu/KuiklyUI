import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCalendarModule 日历模块测试', () => {
  test('应该成功加载 CalendarModuleTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=CalendarModuleTestPage')).toBeVisible();
  });

  test('时间戳转日历操作应触发 KRCalendarModule', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const btn = kuiklyPage.page.locator('text=timestampToCalendar');
    await expect(btn).toBeVisible();
    await btn.click();

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /calendar:/ }).first()).toBeVisible();
  });

  test('日历转时间戳操作应触发 KRCalendarModule', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const btn = kuiklyPage.page.locator('text=calendarToTimestamp');
    await expect(btn).toBeVisible();
    await btn.click();

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /timestamp:/ }).first()).toBeVisible();
  });

  test('日历 add 操作应触发 KRCalendarModule', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const btn = kuiklyPage.page.locator('text=addCalendar');
    await expect(btn).toBeVisible();
    await btn.click();

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /added:/ }).first()).toBeVisible();
  });

  test('时间格式化操作应触发 KRCalendarModule', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const btn = kuiklyPage.page.locator('text=formatTimestamp');
    await expect(btn).toBeVisible();
    await btn.click();

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /formatted:/ }).first()).toBeVisible();
  });
});
