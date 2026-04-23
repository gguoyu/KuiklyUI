import { test, expect } from '../../../fixtures/test-base';

test.describe('KRTextView static 验证', () => {
  test('应该成功加载 KRTextViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 不同字号')).toBeVisible();
  });

  test('应该正确渲染不同字号的文本', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=字号 10')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=字号 16')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=字号 24')).toBeVisible();
  });

  test('应该正确渲染不同颜色的文本', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=红色文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=蓝色文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=绿色文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=紫色文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=橙色文本')).toBeVisible();
  });

  test('应该正确渲染文本装饰', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=下划线文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=删除线文本')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=斜体文本')).toBeVisible();
  });
});
