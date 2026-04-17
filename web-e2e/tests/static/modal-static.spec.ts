import { test, expect } from '../../fixtures/test-base';

test.describe('Modal 静态验证', () => {
  test('应该成功加载 ModalTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. AlertDialog 弹窗')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. ActionSheet 底部菜单')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 自定义 Modal 弹窗')).toBeVisible();
  });

  test('应该正确渲染所有触发按钮', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('显示 Alert 弹窗')).toBeVisible();
    await expect(kuiklyPage.page.getByText('显示 ActionSheet')).toBeVisible();
    await expect(kuiklyPage.page.getByText('显示自定义弹窗')).toBeVisible();

    const resultTexts = kuiklyPage.page.getByText('未操作');
    expect(await resultTexts.count()).toBeGreaterThanOrEqual(3);
  });
});
