import { test, expect } from '../../fixtures/test-base';

test.describe('NavigationTestPage visual', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('NavigationTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('视觉回归：NavigationTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page).toHaveScreenshot('navigation-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：NavigationTestPage 切换 Tab 后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('消息').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('navigation-test-message-tab.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：NavigationTestPage 子页面截图', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('设置页面').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('navigation-test-subpage.png', {
      maxDiffPixels: 300,
    });
  });
});
