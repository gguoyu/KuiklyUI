import { test, expect } from '../../fixtures/test-base';

test.describe('SearchTestPage visual', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('视觉回归：SearchTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page).toHaveScreenshot('search-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：SearchTestPage 搜索 berry 过滤后截图', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('berry');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('search-test-filtered.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：SearchTestPage 点击列表项后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('Mango 芒果').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('search-test-item-selected.png', {
      maxDiffPixels: 300,
    });
  });
});
