import { test, expect } from '../../../fixtures/test-base';

test.describe('Auto KRViewTestPage static 验证', () => {
  test('should render KRViewTestPage stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 不同尺寸').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 不同背景色').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
