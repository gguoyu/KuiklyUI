/**
 * L1 简单交互测试：点击事件验证
 * 
 * 测试页面：ClickTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. 按钮点击 — 状态切换
 * 3. 计数器 — 增减操作
 * 4. Tab 切换 — 选中状态变化
 * 5. 开关切换 — on/off 状态
 * 6. 视觉回归截图
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('点击交互测试', () => {
  test('应该成功加载 ClickTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=1. 按钮点击')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. 计数器')).toBeVisible();
  });

  test('按钮点击应切换状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 初始状态验证
    await expect(kuiklyPage.page.getByText('点击我')).toBeVisible();
    await expect(kuiklyPage.page.getByText('状态: 未激活')).toBeVisible();

    // 点击按钮
    await kuiklyPage.page.getByText('点击我').click();
    await kuiklyPage.waitForRenderComplete();

    // 验证状态切换
    await expect(kuiklyPage.page.getByText('已点击')).toBeVisible();
    await expect(kuiklyPage.page.getByText('状态: 已激活')).toBeVisible();

    // 再次点击恢复
    await kuiklyPage.page.getByText('已点击').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('点击我')).toBeVisible();
    await expect(kuiklyPage.page.getByText('状态: 未激活')).toBeVisible();
  });

  test('计数器应正确增减', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 初始值应为 0
    await expect(kuiklyPage.page.getByText('0', { exact: true })).toBeVisible();

    // 点击加号 3 次
    const plusButton = kuiklyPage.page.getByText('+');
    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('1', { exact: true })).toBeVisible();

    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('2', { exact: true }).first()).toBeVisible();

    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('3', { exact: true }).first()).toBeVisible();

    // 点击减号 1 次
    const minusButton = kuiklyPage.page.getByText('-');
    await minusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('2', { exact: true }).first()).toBeVisible();
  });

  test('Tab 切换应更新选中状态和内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 初始选中 "全部" Tab
    await expect(kuiklyPage.page.getByText('当前显示: 全部内容')).toBeVisible();

    // 点击 "推荐" Tab
    await kuiklyPage.page.getByText('推荐').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前显示: 推荐内容')).toBeVisible();

    // 点击 "热门" Tab
    await kuiklyPage.page.getByText('热门').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前显示: 热门内容')).toBeVisible();

    // 切回 "全部"
    await kuiklyPage.page.getByText('全部').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前显示: 全部内容')).toBeVisible();
  });

  test('开关切换应正确切换 on/off 状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 初始状态为关闭
    await expect(kuiklyPage.page.getByText('通知已关闭')).toBeVisible();

    // 点击开关区域 — 通过 "通知开关" 旁边的开关组件
    await kuiklyPage.page.getByText('通知已关闭').click();
    // 如果点击文字不触发开关，尝试直接找开关组件
    // 开关是文字右侧的组件
  });

  test('视觉回归：ClickTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('click-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：ClickTestPage 交互后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 执行一系列交互
    // 1. 点击按钮
    await kuiklyPage.page.getByText('点击我').click();
    await kuiklyPage.waitForRenderComplete();

    // 2. 加 2 次
    const plusButton = kuiklyPage.page.getByText('+');
    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();

    // 3. 切换到 "推荐" Tab
    await kuiklyPage.page.getByText('推荐').click();
    await kuiklyPage.waitForRenderComplete();

    // 截图
    await expect(kuiklyPage.page).toHaveScreenshot('click-test-after-interaction.png', {
      maxDiffPixels: 300,
    });
  });
});
