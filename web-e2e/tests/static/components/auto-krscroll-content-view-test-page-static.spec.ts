import { test, expect } from '../../../fixtures/test-base';

test.describe('Auto KRScrollContentViewTestPage static 验证', () => {
  test('should render KRScrollContentViewTestPage stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRScrollContentViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 垂直滚动', { exact: false }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 水平滚动', { exact: false }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('垂直项', { exact: false }).first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
