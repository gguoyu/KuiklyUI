import { test, expect } from '../../../fixtures/test-base';

test.describe('CalendarModule additional coverage', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('formatWithQuotes uses single-quoted literal pattern — covers getReplaceReadyFormatString', async ({ kuiklyPage }) => {
    // Click formatWithQuotes button which uses pattern "yyyy'年'MM'月'dd'日'"
    // This exercises getReplaceReadyFormatString / formatDateStrWithSingleQuote paths
    await kuiklyPage.page.getByText('formatWithQuotes', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    // Result should start with "quoted:" followed by a year number
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

  test('formatTimestamp produces millisecond-precision result', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('formatTimestamp', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('formatted:2024-10-01 08:30:00.100', { exact: true })).toBeVisible({ timeout: 5000 });
  });
});
