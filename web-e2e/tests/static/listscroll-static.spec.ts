import { test, expect } from '../../fixtures/test-base';

test.describe('list scroll static 验证', () => {
  test('应该成功加载 ListScrollTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('列表滚动测试', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.component('KRListView').first()).toBeVisible();
  });
});
