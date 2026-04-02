/**
 * L1 模块测试：通知模块（KRNotifyModule）
 *
 * 测试页面：NotifyModuleTestPage
 * 对应 Kotlin 源文件：KRNotifyModule.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 NotifyModule 初始化
 * 2. 点击发送按钮 — 调用 postNotify() 方法
 * 3. 发送计数更新验证
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRNotifyModule 通知模块测试', () => {
  test('应该成功加载 NotifyModuleTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=NotifyModuleTestPage')).toBeVisible();
  });

  test('点击发送事件按钮应触发 KRNotifyModule.postNotify()', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 初始发送次数为 0
    await expect(kuiklyPage.page.locator('text=count:0')).toBeVisible();

    // 点击发送按钮（使用 exact match 避免匹配到说明文字）
    await kuiklyPage.page.getByLabel('send', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    // 发送次数应变为 1
    await expect(kuiklyPage.page.locator('text=count:1')).toBeVisible();
  });

  test('多次点击发送按钮应累计计数', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const sendBtn = kuiklyPage.page.getByLabel('send', { exact: true });
    await sendBtn.click();
    await kuiklyPage.waitForRenderComplete();
    await sendBtn.click();
    await kuiklyPage.waitForRenderComplete();
    await sendBtn.click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=count:3')).toBeVisible();
  });
});
