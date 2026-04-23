import { test, expect } from '../../fixtures/test-base';

test.describe('事件捕获 static 验证', () => {
  test('应该成功加载 EventCaptureTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('capture-title', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('page-1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('reset', { exact: true })).toBeVisible();
  });
});
