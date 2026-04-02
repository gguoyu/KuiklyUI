import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCalendarModule example page branches', () => {
  test('example page should expose day-of-year, setDayOfYear and parse results', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleExamplePage');
    await kuiklyPage.waitForRenderComplete();

    const bodyText = await kuiklyPage.page.evaluate(() => document.body.innerText);

    expect(bodyText).toContain('dy275/dw3 8:30:0:100');
    expect(bodyText).toContain('2025-01-01T-Date');
    expect(bodyText).toContain('1735693501100');
  });
});
