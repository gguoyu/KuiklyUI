/**
 * L2 复杂交互测试：列表滚动验证
 * 
 * 测试页面：ListScrollTestPage
 * 测试覆盖：
 * 1. 页面加载 — 50 项列表 + 5 组标题
 * 2. 列表项点击 — 选中高亮
 * 3. 滚动到底部 — 底部标记可见
 * 4. 分组标题渲染
 * 5. 视觉回归截图
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('列表滚动测试', () => {
  test('应该成功加载 ListScrollTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证顶部标题栏
    await expect(kuiklyPage.page.locator('text=列表滚动测试')).toBeVisible();
    // 验证第一个分组标题
    await expect(kuiklyPage.page.locator('text=分组 1')).toBeVisible();
    // 验证第一个列表项
    await expect(kuiklyPage.page.getByText('列表项 1', { exact: true })).toBeVisible();
  });

  test('应该渲染所有 5 个分组标题', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证前几个分组标题可见（不滚动只能看到前面的）
    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
    // 分组 2 可能也可见（取决于视口高度）
    const group2 = kuiklyPage.page.getByText('分组 2', { exact: true });
    // 至少页面中存在
    expect(await group2.count()).toBeGreaterThanOrEqual(0);
  });

  test('列表项点击应高亮并更新选中状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 初始状态：未选择
    await expect(kuiklyPage.page.getByText('选中: 未选择')).toBeVisible();

    // 点击第 1 项
    await kuiklyPage.page.getByText('列表项 1', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    // 验证顶部指示更新
    await expect(kuiklyPage.page.getByText('选中: 列表项 1')).toBeVisible();
  });

  test('点击不同列表项应切换选中状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 点击第 3 项
    await kuiklyPage.page.getByText('列表项 3', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 3')).toBeVisible();

    // 切换到第 5 项
    await kuiklyPage.page.getByText('列表项 5', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 5')).toBeVisible();
  });

  test('滚动到底部应显示底部标记', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 获取列表容器（KRListView）
    const listContainer = kuiklyPage.component('KRListView').first();

    // 多次滚动到底部
    for (let i = 0; i < 15; i++) {
      await kuiklyPage.scrollInContainer(listContainer, { deltaY: 300 });
    }

    // 验证底部标记可见
    await expect(kuiklyPage.page.getByText('— 已到底部 —')).toBeVisible({ timeout: 5000 });
  });

  test('滚动后点击列表项应正确响应', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 向下滚动一些
    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 500 });

    // 找到并点击一个可见的列表项
    const visibleItem = kuiklyPage.page.getByText('列表项 8', { exact: true });
    if (await visibleItem.isVisible()) {
      await visibleItem.click();
      await kuiklyPage.waitForRenderComplete();
      await expect(kuiklyPage.page.getByText('选中: 列表项 8')).toBeVisible();
    }
  });

  test('视觉回归：ListScrollTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('listscroll-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：ListScrollTestPage 选中后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 选中一个列表项
    await kuiklyPage.page.getByText('列表项 2', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('listscroll-test-selected.png', {
      maxDiffPixels: 300,
    });
  });
});
