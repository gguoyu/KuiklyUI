import { test, expect } from '../../fixtures/test-base';

test.describe('NavigationTestPage static', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NavigationTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('应该成功加载 NavigationTestPage 页面', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('首页').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('🏠').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('🔍').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('💬').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('👤').first()).toBeVisible();
  });

  test('应该渲染当前页面信息卡和子页面入口', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('当前页面: 首页')).toBeVisible();
    await expect(kuiklyPage.page.getByText('设置页面')).toBeVisible();
    await expect(kuiklyPage.page.getByText('详情页面')).toBeVisible();
    await expect(kuiklyPage.page.getByText('编辑页面')).toBeVisible();
  });
});
