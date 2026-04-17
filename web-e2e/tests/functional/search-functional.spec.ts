import { test, expect } from '../../fixtures/test-base';

async function getStatText(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const els = document.querySelectorAll('p');
    for (const p of els) {
      const text = p.textContent || '';
      if (text.includes('个水果') || text.includes('个结果')) {
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

  test('fill + 点击搜索后统计文字应从"共 N"变为"找到 N 个结果"', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('berry');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/找到 3 个结果/);
  });

  test('搜索 mango 应返回 1 个结果', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('mango');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/找到 1 个结果/);
  });

  test('搜索不存在关键词应显示“找到 0 个结果”', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('zzznomatch999');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/找到 0 个结果/);
  });

  test('清空输入框后应将统计文字恢复为“共 N 个水果”', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('mango');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    let stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/找到 1 个结果/);

    await input.fill('');
    await kuiklyPage.waitForRenderComplete();

    stat = await getStatText(kuiklyPage.page);
    expect(stat).toContain('共 20 个水果');
  });

  test('连续不同关键词搜索结果数应各自正确', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');

    await input.fill('a');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();
    const statA = await getStatText(kuiklyPage.page);
    const countA = parseInt(statA.match(/\d+/)?.[0] || '0', 10);
    expect(countA).toBeGreaterThan(1);

    await input.fill('watermelon');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();
    const statWatermelon = await getStatText(kuiklyPage.page);
    expect(statWatermelon).toMatch(/找到 1 个结果/);
  });

  test('点击列表项应改变该行背景色', async ({ kuiklyPage }) => {
    const bgBefore = await getRowBgForText(kuiklyPage.page, 'Apple 苹果');

    await kuiklyPage.page.getByText('Apple 苹果').click();
    await kuiklyPage.waitForRenderComplete();

    const bgAfter = await getRowBgForText(kuiklyPage.page, 'Apple 苹果');
    expect(bgAfter).not.toBe(bgBefore);
  });
});
