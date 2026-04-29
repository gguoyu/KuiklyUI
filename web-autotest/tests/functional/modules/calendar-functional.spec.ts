import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCalendarModule functional', () => {
  // === CalendarModuleTestPage: basic operations ===

  test('basic operations: timestampToCalendar / calendarToTimestamp / addCalendar / formatTimestamp', async ({ kuiklyPage }) => {
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

  // === CalendarModuleTestPage: coverage branches ===

  test('formatWithQuotes uses single-quoted literal pattern — covers getReplaceReadyFormatString', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('formatWithQuotes', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    const resultText = await kuiklyPage.page.evaluate(() => {
      const els = document.querySelectorAll('p');
      for (const el of els) {
        const t = el.textContent || '';
        if (t.startsWith('quoted:')) return t;
      }
      return '';
    });
    expect(resultText).toMatch(/^quoted:\d{4}/);
  });

  // === CalendarModuleTestPage: precision assertions ===

  test('parseFormattedTime should convert formatted string back to timestamp', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 200, smooth: false });
    await kuiklyPage.page.getByText('parseFormattedTime', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    const parseText = await kuiklyPage.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find(e => (e.textContent || '').startsWith('parse:'));
      return el?.textContent || '';
    });
    expect(parseText).toMatch(/^parse:\d+$/);
  });

  test('getMoreFields should return complete time fields', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 300, smooth: false });
    await kuiklyPage.page.getByText('getMoreFields', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    const fieldsText = await kuiklyPage.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find(e => (e.textContent || '').startsWith('fields:'));
      return el?.textContent || '';
    });
    expect(fieldsText).toMatch(/^fields:\d+-\d+-\d+-\d+-\d+$/);
  });

  test('addMoreFields should add to DAY_OF_MONTH/HOUR_OF_DAY/SECOND/MILLISECOND and get DAY_OF_WEEK', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 400, smooth: false });
    await kuiklyPage.page.getByText('addMoreFields', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    const fieldsText = await kuiklyPage.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find(e => (e.textContent || '').startsWith('fields-add:'));
      return el?.textContent || '';
    });
    expect(fieldsText).toMatch(/^fields-add:\d+-\d+$/);
  });

  // === CalendarAdvancedTestPage ===

  test('advanced: DAY_OF_YEAR / MILLISECOND / getTimeInMillis / parseFormat error / format quotes', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarAdvancedTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('DAY_OF_YEAR add/set', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/doy:\d+/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('MILLISECOND add/set', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/ms:\d+/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('getTimeInMillis ops', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/tim:\d+/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('parseFormat error', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/parseErr:/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('format quotes', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/q:/, { exact: false })).toBeVisible();
  });
});
