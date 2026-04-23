import { test, expect } from '../../../fixtures/test-base';

test.describe('Shadow static 验证', () => {
  test('应该成功加载 ShadowTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 不同模糊半径')).toBeVisible();
  });

  test('应该正确渲染不同模糊半径', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();

    const blurLabels = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"]');
    expect(await blurLabels.count()).toBeGreaterThan(0);
    await expect(kuiklyPage.page.locator('text=2. 不同偏移量')).toBeVisible();
  });

  test('应该正确渲染所有阴影分区', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=3. 不同阴影颜色')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 阴影+圆角组合')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 阴影强度梯度')).toBeVisible();
  });

  test('应该正确渲染阴影颜色变体', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ShadowTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('蓝', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('红', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('绿', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('紫', { exact: true })).toBeVisible();
  });
});
