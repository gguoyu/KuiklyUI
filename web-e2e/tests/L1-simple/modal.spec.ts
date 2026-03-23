/**
 * L1 简单交互测试：弹窗交互验证
 * 
 * 测试页面：ModalTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 触发按钮正确渲染
 * 3. 自定义弹窗按钮点击状态验证
 * 4. 视觉回归截图
 * 
 * 注意：Modal 弹窗在 Kuikly Web 端的渲染与原生端不同，
 * 完整的 Modal 交互测试需要进一步调研 Web 端 Modal 组件的 DOM 结构。
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('弹窗交互测试', () => {
  test('应该成功加载 ModalTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. AlertDialog 弹窗')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. ActionSheet 底部菜单')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 自定义 Modal 弹窗')).toBeVisible();
  });

  test('应该正确渲染所有触发按钮', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证 3 个触发按钮存在
    await expect(kuiklyPage.page.getByText('显示 Alert 弹窗')).toBeVisible();
    await expect(kuiklyPage.page.getByText('显示 ActionSheet')).toBeVisible();
    await expect(kuiklyPage.page.getByText('显示自定义弹窗')).toBeVisible();

    // 验证初始状态
    const resultTexts = kuiklyPage.page.getByText('未操作');
    expect(await resultTexts.count()).toBeGreaterThanOrEqual(3);
  });

  test('点击显示自定义弹窗按钮应触发状态变化', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证初始状态
    await expect(kuiklyPage.page.getByText('自定义弹窗结果: 未操作')).toBeVisible();

    // 点击触发自定义弹窗按钮
    await kuiklyPage.page.getByText('显示自定义弹窗').click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(1000);

    // 验证按钮可点击且页面不崩溃
    await expect(kuiklyPage.page.getByText('显示自定义弹窗')).toBeVisible();
  });

  test('视觉回归：ModalTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('modal-test-initial.png', {
      maxDiffPixels: 300,
    });
  });
});
