import { test, expect } from '../../fixtures/test-base';

test.describe('Modal functional 验证', () => {
  test('点击显示自定义弹窗按钮后页面应保持稳定', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('自定义弹窗结果: 未操作')).toBeVisible();

    await kuiklyPage.page.getByText('显示自定义弹窗').click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(1000);

    await expect(kuiklyPage.page.getByText('显示自定义弹窗')).toBeVisible();
  });
});
