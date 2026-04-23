import { test, expect } from '../../fixtures/test-base';

test.describe('NavigationTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NavigationTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('底部 Tab 切换应更新页面内容', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('当前页面: 首页')).toBeVisible();

    await kuiklyPage.page.getByText('发现').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前页面: 发现')).toBeVisible();

    await kuiklyPage.page.getByText('消息').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前页面: 消息')).toBeVisible();

    await kuiklyPage.page.getByText('个人中心').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前页面: 个人中心')).toBeVisible();
  });

  test('导航步骤计数应正确递增', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('步骤: 1')).toBeVisible();

    await kuiklyPage.page.getByText('发现').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('步骤: 2')).toBeVisible();

    await kuiklyPage.page.getByText('消息').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('步骤: 3')).toBeVisible();
  });

  test('点击子页面入口应进入子页面', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('路径: 首页')).toBeVisible();

    await kuiklyPage.page.getByText('设置页面').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('路径: 首页 → 设置页面')).toBeVisible();
    await expect(kuiklyPage.page.getByText('步骤: 2')).toBeVisible();
  });

  test('子页面返回应回到主页面', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('详情页面').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('路径: 首页 → 详情页面')).toBeVisible();
    await expect(kuiklyPage.page.getByText('步骤: 2')).toBeVisible();

    await kuiklyPage.page.getByText('重置导航历史').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('路径: 首页')).toBeVisible();
    await expect(kuiklyPage.page.getByText('步骤: 1')).toBeVisible();
  });

  test('面包屑路径应正确追踪导航历史', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('路径: 首页')).toBeVisible();

    await kuiklyPage.page.getByText('发现').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('路径: 首页 → 发现')).toBeVisible();

    await kuiklyPage.page.getByText('设置页面').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('路径: 首页 → 发现 → 设置页面')).toBeVisible();
  });

  test('重置导航应恢复初始状态', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('发现').click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.getByText('消息').click();
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('重置导航历史').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('当前页面: 首页')).toBeVisible();
    await expect(kuiklyPage.page.getByText('路径: 首页')).toBeVisible();
    await expect(kuiklyPage.page.getByText('步骤: 1')).toBeVisible();
  });
});
