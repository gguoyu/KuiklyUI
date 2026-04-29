import { test, expect } from '../../fixtures/test-base';

test.describe('NavigationTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NavigationTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('底部 Tab 切换应更新页面内容', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('当前页面: 首页', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('发现', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前页面: 发现', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('消息', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前页面: 消息', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('个人中心', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前页面: 个人中心', { exact: false })).toBeVisible();
  });

  test('导航步骤计数应正确递增', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('步骤: 1', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('发现', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('步骤: 2', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('消息', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('步骤: 3', { exact: false })).toBeVisible();
  });

  test('点击子页面入口应进入子页面', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('路径: 首页', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('设置页面', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('路径: 首页 → 设置页面', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('步骤: 2', { exact: false })).toBeVisible();
  });

  test('子页面返回应回到主页面', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('详情页面', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('路径: 首页 → 详情页面', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('步骤: 2', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('重置导航历史', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('路径: 首页', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('步骤: 1', { exact: false })).toBeVisible();
  });

  test('面包屑路径应正确追踪导航历史', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('路径: 首页', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('发现', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('路径: 首页 → 发现', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('设置页面', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('路径: 首页 → 发现 → 设置页面', { exact: false })).toBeVisible();
  });

  test('重置导航应恢复初始状态', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('发现', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.getByText('消息', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('重置导航历史', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('当前页面: 首页', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('路径: 首页', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('步骤: 1', { exact: false })).toBeVisible();
  });
});
