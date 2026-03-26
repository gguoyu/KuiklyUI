/**
 * L1 模块测试：通知模块（KRNotifyModule）
 *
 * 测试页面：NotifyToHostDemo
 * 对应 Kotlin 源文件：KRNotifyModule.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 NotifyModule 初始化
 * 2. 点击发送按钮 — 调用 postNotify() 方法
 * 3. 发送计数更新验证
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRNotifyModule 通知模块测试', () => {
  test('应该成功加载 NotifyToHostDemo 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyToHostDemo');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=Kuikly -> Web Host 事件示例')).toBeVisible();
  });

  test('点击发送事件按钮应触发 KRNotifyModule.postNotify()', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyToHostDemo');
    await kuiklyPage.waitForRenderComplete();

    // 初始发送次数为 0
    await expect(kuiklyPage.page.locator('text=已发送: 0 次')).toBeVisible();

    // 点击发送按钮（使用 exact match 避免匹配到说明文字）
    await kuiklyPage.page.getByLabel('发送事件', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    // 发送次数应变为 1
    await expect(kuiklyPage.page.locator('text=已发送: 1 次')).toBeVisible();
  });

  test('多次点击发送按钮应累计计数', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyToHostDemo');
    await kuiklyPage.waitForRenderComplete();

    const sendBtn = kuiklyPage.page.getByLabel('发送事件', { exact: true });
    await sendBtn.click();
    await kuiklyPage.waitForRenderComplete();
    await sendBtn.click();
    await kuiklyPage.waitForRenderComplete();
    await sendBtn.click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=已发送: 3 次')).toBeVisible();
  });
});
