import { test, expect } from '../../../fixtures/test-base';

test.describe('Overflow static 验证', () => {
  test('应该成功加载 OverflowTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OverflowTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. overflow裁剪')).toBeVisible();
  });

  test('应该正确渲染裁剪和溢出模式', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OverflowTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=子元素超出部分被裁剪')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. overflow溢出')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=子元素超出部分可见')).toBeVisible();

    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);
  });

  test('应该正确渲染圆角裁剪组合', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OverflowTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=3. 圆角+裁剪组合')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=圆角容器裁剪超出的子元素')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 不等圆角裁剪')).toBeVisible();
    await expect(kuiklyPage.page.getByText('圆形裁剪', { exact: true })).toBeVisible();
  });
});
