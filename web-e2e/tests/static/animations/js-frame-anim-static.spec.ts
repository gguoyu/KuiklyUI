import { test, expect } from '../../../fixtures/test-base';

test.describe('JS 帧动画 static 验证', () => {
  test('应该成功加载 JSFrameAnimTestPage 页面并展示初始状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('JSFrameAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 进度条帧动画', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('进度: 0%', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('当前色块: 1 / 5', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('开始动画', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('开始跑马灯', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('开始计数', { exact: true })).toBeVisible();
  });
});
