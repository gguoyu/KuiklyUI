/**
 * L1 模块测试：日历模块（KRCalendarModule）
 *
 * 测试页面：CalendarModuleExamplePage
 * 对应 Kotlin 源文件：KRCalendarModule.kt（0% → 提升覆盖率）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发 KRCalendarModule 初始化
 * 2. 时间戳转日历操作 — 调用 toCalendar()
 * 3. 日历转时间戳操作 — 调用 toTimestamp()
 * 4. 日历 add 操作
 * 5. 时间格式化操作
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCalendarModule 日历模块测试', () => {
  test('应该成功加载 CalendarModuleExamplePage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleExamplePage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('时间戳转日历操作应触发 KRCalendarModule', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleExamplePage');
    await kuiklyPage.waitForRenderComplete();

    // 点击"时间戳转日历"按钮触发模块调用
    const btn = kuiklyPage.page.locator('text=时间戳转日历');
    await expect(btn).toBeVisible();
    await btn.click();
    await kuiklyPage.waitForRenderComplete();

    // 结果文本应包含日历数据（年份格式）
    const resultEl = kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /日历：/ });
    await expect(resultEl.first()).toBeVisible();
  });

  test('日历转时间戳操作应触发 KRCalendarModule', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleExamplePage');
    await kuiklyPage.waitForRenderComplete();

    const btn = kuiklyPage.page.locator('text=日历转时间戳');
    await expect(btn).toBeVisible();
    await btn.click();
    await kuiklyPage.waitForRenderComplete();

    const resultEl = kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /时间戳：/ });
    await expect(resultEl.first()).toBeVisible();
  });

  test('日历 add 操作应触发 KRCalendarModule', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleExamplePage');
    await kuiklyPage.waitForRenderComplete();

    const btn = kuiklyPage.page.locator('text=日历add操作');
    await expect(btn).toBeVisible();
    await btn.click();
    await kuiklyPage.waitForRenderComplete();
  });

  test('时间格式化操作应触发 KRCalendarModule', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CalendarModuleExamplePage');
    await kuiklyPage.waitForRenderComplete();

    // 格式化按钮在页面底部，需要先滚动到底部
    await kuiklyPage.page.keyboard.press('End');
    await kuiklyPage.page.waitForTimeout(500);

    // 使用文本内容定位（exact 避免歧义）
    const btn = kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /^格式化时间戳$/ }).last();
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toBeVisible();
    await btn.click();
    await kuiklyPage.waitForRenderComplete();
  });
});
