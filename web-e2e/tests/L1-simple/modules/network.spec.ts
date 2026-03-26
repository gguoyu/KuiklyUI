/**
 * L1 模块测试：网络请求模块（KRNetworkModule）
 *
 * 测试页面：NetworkExamplePage
 * 对应 Kotlin 源文件：KRNetworkModule.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 KRNetworkModule 初始化
 * 2. GET 请求按钮点击 — 触发 requestGet() 方法
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRNetworkModule 网络请求模块测试', () => {
  test('应该成功加载 NetworkExamplePage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkExamplePage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=网络请求示例')).toBeVisible();
  });

  test('requestGet 按钮应存在并可点击', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NetworkExamplePage');
    await kuiklyPage.waitForRenderComplete();

    const btn = kuiklyPage.page.getByLabel('requestGet', { exact: true });
    await expect(btn).toBeVisible();

    // 点击触发 KRNetworkModule.requestGet() 调用（覆盖率核心目标）
    await btn.click();
    await kuiklyPage.waitForRenderComplete();
  });
});
