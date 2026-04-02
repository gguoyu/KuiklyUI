import type { Page } from '@playwright/test';

import { test, expect } from '../../../fixtures/test-base';

async function waitForResult(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: 15000 });
}

test.describe('KRNetworkModule 网络请求模块测试', () => {
  test('应该成功加载 NetworkModuleTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('NetworkModuleTestPage')).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestGet', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestPostBinary', { exact: true })).toBeVisible();
  });

  test('requestGet 应返回 200 和查询参数结果', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByLabel('requestGet', { exact: true }).click();

    await waitForResult(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('success=true', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=200', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('http://localhost:8080/api/network/get?key=value', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('requestGetBinary 应暴露当前实现下的 GET body 错误路径', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByLabel('requestGetBinary', { exact: true }).click();

    await waitForResult(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('success=true', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=-1002', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('Request with GET/HEAD method cannot have body.', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('requestPost 应返回 200 和 JSON 回显', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByLabel('requestPost', { exact: true }).click();

    await waitForResult(kuiklyPage.page, 'Post request completed:');
    await expect(kuiklyPage.page.getByText('success=true', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=200', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('http://localhost:8080/api/network/post', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('"key":"value"', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('requestPostBinary 应返回 hello world 回显', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByLabel('requestPostBinary', { exact: true }).click();

    await waitForResult(kuiklyPage.page, 'Post request completed:');
    await expect(kuiklyPage.page.getByText('success=true', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=200', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('hello world', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('status204 应返回 204 和空响应错误路径', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByLabel('status204', { exact: true }).click();

    await waitForResult(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('success=false', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=204', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('Unexpected end of JSON input', { exact: false })).toBeVisible({ timeout: 15000 });
  });
});
