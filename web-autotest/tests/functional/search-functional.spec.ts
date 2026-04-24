import { test, expect } from '../../fixtures/test-base';

async function getStatText(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const els = document.querySelectorAll('p');
    for (const p of els) {
      const text = p.textContent || '';
      if (text.startsWith('found:') || text.startsWith('total:')) {
        return text;
      }
    }
    return '';
  });
}

async function getRowBgForText(page: import('@playwright/test').Page, keyword: string): Promise<string> {
  return page.evaluate((kw: string) => {
    const views = document.querySelectorAll('[data-kuikly-component="KRView"]');
    for (const view of Array.from(views)) {
      const element = view as HTMLElement;
      if (element.innerText?.includes(kw) && element.innerText.length < 50) {
        return window.getComputedStyle(element).backgroundColor;
      }
    }
    return '';
  }, keyword);
}

test.describe('SearchTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('fill + search should change stat from "total: N" to "found: N"', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('search...');
    await input.fill('berry');
    await kuiklyPage.page.getByText('search').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/found: 3/);
  });

  test('search mango should return 1 result', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('search...');
    await input.fill('mango');
    await kuiklyPage.page.getByText('search').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/found: 1/);
  });

  test('search with no match should show "found: 0"', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('search...');
    await input.fill('zzznomatch999');
    await kuiklyPage.page.getByText('search').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/found: 0/);
  });

  test('clearing input should restore "total: N" stat', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('search...');
    await input.fill('mango');
    await kuiklyPage.page.getByText('search').click();
    await kuiklyPage.waitForRenderComplete();

    let stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/found: 1/);

    await input.fill('');
    await kuiklyPage.waitForRenderComplete();

    stat = await getStatText(kuiklyPage.page);
    expect(stat).toContain('total: 20');
  });

  test('consecutive searches should each return correct counts', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('search...');

    await input.fill('a');
    await kuiklyPage.page.getByText('search').click();
    await kuiklyPage.waitForRenderComplete();
    const statA = await getStatText(kuiklyPage.page);
    const countA = parseInt(statA.match(/\d+/)?.[0] || '0', 10);
    expect(countA).toBeGreaterThan(1);

    await input.fill('watermelon');
    await kuiklyPage.page.getByText('search').click();
    await kuiklyPage.waitForRenderComplete();
    const statWatermelon = await getStatText(kuiklyPage.page);
    expect(statWatermelon).toMatch(/found: 1/);
  });

  test('clicking a list item should change its background color', async ({ kuiklyPage }) => {
    const bgBefore = await getRowBgForText(kuiklyPage.page, 'Apple');

    await kuiklyPage.page.getByText('Apple').first().click();
    await kuiklyPage.waitForRenderComplete();

    const bgAfter = await getRowBgForText(kuiklyPage.page, 'Apple');
    expect(bgAfter).not.toBe(bgBefore);
  });
});
