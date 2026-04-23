import { test, expect } from '../../../fixtures/test-base';

test.describe('KRNetworkModule static 验证', () => {
  test('应该成功加载 NetworkModuleTestPage 页面并展示稳定入口', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('NetworkModuleTestPage', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestGet', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestGetBinary', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestPost', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestPostBinary', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('status204', { exact: true })).toBeVisible();
  });
});
