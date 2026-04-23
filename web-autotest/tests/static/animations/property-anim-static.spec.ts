import { test, expect } from '../../../fixtures/test-base';

test.describe('属性动画 static 验证', () => {
  test('应该成功加载 PropertyAnimTestPage 页面并展示初始入口', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. Linear 平移动画', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('播放平移', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('弹性运动', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('变换颜色', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('平移+旋转', { exact: true })).toBeVisible();
  });
});
