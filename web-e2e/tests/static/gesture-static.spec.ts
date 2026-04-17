import { test, expect } from '../../fixtures/test-base';

test.describe('Gesture 静态验证', () => {
  test('应该成功加载 GestureTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 水平翻页')).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 双击事件')).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. 长按事件')).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. 多区域点击')).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. 手势状态面板')).toBeVisible();
  });

  test('长按区域应保持稳定的初始状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('长按此区域')).toBeVisible();
    await expect(kuiklyPage.page.getByText('长按状态: 未激活')).toBeVisible();
    await expect(kuiklyPage.page.getByText('按住不放约 500ms')).toBeVisible();
  });
});
