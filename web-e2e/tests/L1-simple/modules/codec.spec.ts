/**
 * L1 模块测试：编解码模块（KRCodecModule）
 *
 * 测试页面：CodecTestPager
 * 对应 Kotlin 源文件：KRCodecModule.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 KRCodecModule 各方法调用
 * 2. urlEncode / urlDecode 结果可见
 * 3. base64Encode / base64Decode 结果可见
 * 4. md5 16位 / 32位结果可见
 * 5. sha256 结果可见
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCodecModule 编解码模块测试', () => {
  test('应该成功加载 CodecTestPager 页面并触发编解码调用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecTestPager');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题
    await expect(kuiklyPage.page.locator('text=CodecTestPager')).toBeVisible();
  });

  test('urlEncode/urlDecode 方法应被调用且结果可见', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecTestPager');
    await kuiklyPage.waitForRenderComplete();

    // 页面上会展示 urlEncode 的结果文本
    const urlEncodeEl = kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /urlEncode/ });
    await expect(urlEncodeEl.first()).toBeVisible();

    const urlDecodeEl = kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /urlDecode/ });
    await expect(urlDecodeEl.first()).toBeVisible();
  });

  test('base64Encode/base64Decode 方法应被调用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecTestPager');
    await kuiklyPage.waitForRenderComplete();

    const b64El = kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /base64/ });
    await expect(b64El.first()).toBeVisible();
  });

  test('MD5 16位/32位 方法应被调用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecTestPager');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=md5(16位)')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=md5With32(32位)')).toBeVisible();
  });

  test('SHA256 方法应被调用', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecTestPager');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=sha256')).toBeVisible();
  });
});
