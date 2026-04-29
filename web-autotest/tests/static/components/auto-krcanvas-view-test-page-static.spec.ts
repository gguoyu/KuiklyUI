import { test, expect } from '../../../fixtures/test-base';

test.describe('Auto KRCanvasViewTestPage static 验证', () => {
  test('should render KRCanvasViewTestPage stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 线段绘制', { exact: false }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 矩形绘制', { exact: false }).first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });
});
