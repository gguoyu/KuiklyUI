import { test, expect } from '../../../fixtures/test-base';

test.describe('Auto KRListViewTestPage static 验证', () => {
  test('should render KRListViewTestPage stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRListViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('列表渲染测试').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
