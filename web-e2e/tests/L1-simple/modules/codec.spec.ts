import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCodecModule 编解码模块测试', () => {
  test('应该成功加载 CodecModuleTestPage 页面并触发编解码调用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=CodecModuleTestPage')).toBeVisible();
  });

  test('urlEncode/urlDecode 方法应被调用且结果可见', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /urlEncode:/ }).first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /urlDecode:/ }).first()).toBeVisible();
  });

  test('base64Encode/base64Decode 方法应被调用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /base64Encode:/ }).first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /base64Decode:/ }).first()).toBeVisible();
  });

  test('MD5 16位/32位 方法应被调用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=md5(16):')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=md5(32):')).toBeVisible();
  });

  test('SHA256 方法应被调用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=sha256:')).toBeVisible();
  });
});
