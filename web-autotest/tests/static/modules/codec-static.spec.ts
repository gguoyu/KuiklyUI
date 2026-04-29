import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCodecModule static 验证', () => {
  test('应该成功加载 CodecModuleTestPage 页面并展示编解码结果', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('CodecModuleTestPage', { exact: false })).toBeVisible();
  });

  test('urlEncode/urlDecode 结果应可见', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /urlEncode:/ }).first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /urlDecode:/ }).first()).toBeVisible();
  });

  test('base64Encode/base64Decode 结果应可见', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /base64Encode:/ }).first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /base64Decode:/ }).first()).toBeVisible();
  });

  test('MD5 与 SHA256 结果应可见', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('md5(16):', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('md5(32):', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('sha256:', { exact: false })).toBeVisible();
  });
});
