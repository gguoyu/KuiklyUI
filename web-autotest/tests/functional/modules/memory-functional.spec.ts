import { test, expect } from '../../../fixtures/test-base';

test.describe('KRMemoryData/KRMemoryMonitor functional 验证', () => {
  test('应该成功加载 MemoryModuleTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('MemoryModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('MemoryModuleTestPage', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('retained:0', { exact: false })).toBeVisible();
  });

  test('Create And Retain 按钮应将 retained 计数更新为 1000', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('MemoryModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const createButton = kuiklyPage.page.getByText('Create And Retain 1000 Items', { exact: false }).first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    await expect(kuiklyPage.page.getByText('retained:1000', { exact: false })).toBeVisible();
  });

  test('Dump Memory 按钮点击后页面应保持可交互', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('MemoryModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    const dumpButton = kuiklyPage.page.getByText('Dump Memory', { exact: false });
    await expect(dumpButton).toBeVisible();
    await dumpButton.click();

    await expect(dumpButton).toBeVisible();
    await expect(kuiklyPage.page.getByText('retained:0', { exact: false })).toBeVisible();
  });
});
