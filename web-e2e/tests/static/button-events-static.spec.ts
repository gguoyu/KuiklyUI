import { test, expect } from '../../fixtures/test-base';

test.describe('Button 事件 static 验证', () => {
  test('应该成功加载 ButtonEventTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ButtonEventTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('ButtonEventTestPage', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('click-button', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('double-button', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('long-button', { exact: true })).toBeVisible();
  });
});
