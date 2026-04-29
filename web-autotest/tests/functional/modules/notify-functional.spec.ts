/**
 * functional 测试：通知模块（KRNotifyModule）
 *
 * 测试页面：NotifyModuleTestPage
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRNotifyModule functional 验证', () => {
  test('应该成功加载 NotifyModuleTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=NotifyModuleTestPage')).toBeVisible();
  });

  test('点击发送事件按钮应触发 KRNotifyModule.postNotify()', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=count:0')).toBeVisible();

    await kuiklyPage.page.getByLabel('send', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

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

  test('postNotify 应同步派发 Web host 侧 kuikly_notify 事件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.evaluate(() => {
      (window as typeof window & { __notifyEvents?: Array<{ eventName: string; data: string }> }).__notifyEvents = [];
      window.addEventListener('kuikly_notify', ((event: Event) => {
        const detail = (event as CustomEvent<{ eventName: string; data: string }>).detail;
        (window as typeof window & { __notifyEvents: Array<{ eventName: string; data: string }> }).__notifyEvents.push(detail);
      }) as EventListener, { once: true });
    });

    await kuiklyPage.page.getByLabel('send', { exact: true }).click();

    await expect.poll(async () => {
      return await kuiklyPage.page.evaluate(() => {
        const events = (window as typeof window & { __notifyEvents?: Array<{ eventName: string; data: string }> }).__notifyEvents || [];
        return events.length;
      });
    }).toBe(1);

    const detail = await kuiklyPage.page.evaluate(() => {
      const events = (window as typeof window & { __notifyEvents?: Array<{ eventName: string; data: string }> }).__notifyEvents || [];
      return events[0];
    });

    expect(detail?.eventName).toBe('web_test_notify_event');
    expect(JSON.parse(detail?.data ?? '{}').count).toBe(1);
  });

  test('addNotify 应注册监听并在 postNotify 后增加 receivedCount', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Initial received count should be 0
    await expect(kuiklyPage.page.getByText('received:0', { exact: false })).toBeVisible();

    // Click addNotify — registers listener and posts a test event
    await kuiklyPage.page.getByLabel('addNotify', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    // receivedCount should be 1 after the post
    await expect(kuiklyPage.page.getByText('received:1', { exact: false })).toBeVisible();
  });

  test('removeNotify 应取消监听使后续 postNotify 不再增加计数', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NotifyModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Register listener and trigger it once
    await kuiklyPage.page.getByLabel('addNotify', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('received:1', { exact: false })).toBeVisible();

    // Remove the listener
    await kuiklyPage.page.getByLabel('removeNotify', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    // removeNotify should succeed without crashing
    await expect(kuiklyPage.page.getByText('received:1', { exact: false })).toBeVisible();
  });
});
