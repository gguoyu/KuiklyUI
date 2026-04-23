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

test.describe('SearchTestPage static', () => {
  test('应该成功加载 SearchTestPage 初始全量列表', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toContain('共 20 个水果');

    await expect(kuiklyPage.page.getByPlaceholder('搜索水果...')).toBeVisible();
    await expect(kuiklyPage.page.getByText('Apple 苹果')).toBeVisible();
    await expect(kuiklyPage.page.getByText('Banana 香蕉')).toBeVisible();
  });
});
