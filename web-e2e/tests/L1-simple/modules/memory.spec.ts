/**
 * L1 模块测试：内存监控模块（KRMemoryData / KRMemoryMonitor）
 *
 * 测试页面：MemoryDumpExamplePage
 * 对应 Kotlin 源文件：KRMemoryData.kt、KRMemoryMonitor.kt（低覆盖率 → 提升）
 *
 * 测试覆盖：
 * 1. 页面加载 — 触发内存监控初始化
 * 2. 点击"Dump Memory"按钮 — 触发内存统计方法
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRMemoryData/KRMemoryMonitor 内存模块测试', () => {
  test('应该成功加载 MemoryDumpExamplePage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('MemoryDumpExamplePage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=Memory Dump Example Page')).toBeVisible();
  });

  test('Dump Memory 按钮应存在并可点击（触发 KRMemoryMonitor）', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('MemoryDumpExamplePage');
    await kuiklyPage.waitForRenderComplete();

    const dumpBtn = kuiklyPage.page.locator('text=Dump Memory');
    await expect(dumpBtn).toBeVisible();
    await dumpBtn.click();
    await kuiklyPage.waitForRenderComplete();
  });

  test('Create And Retain 按钮应可触发（增加内存监控覆盖）', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('MemoryDumpExamplePage');
    await kuiklyPage.waitForRenderComplete();

    const createBtn = kuiklyPage.page.locator('text=Create And Retain 1000 Items').first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    await kuiklyPage.waitForRenderComplete();
  });
});
