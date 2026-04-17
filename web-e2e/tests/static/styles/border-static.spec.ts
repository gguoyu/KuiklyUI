import { test, expect } from '../../../fixtures/test-base';

test.describe('Border / BorderRadius static 验证', () => {
  test('应该成功加载 BorderTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 不同边框宽度')).toBeVisible();
  });

  test('应该正确渲染不同边框宽度', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1px', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2px', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4px', { exact: true })).toBeVisible();
  });

  test('应该正确渲染不同边框样式', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('solid', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('dashed', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('dotted', { exact: true })).toBeVisible();
  });

  test('应该正确渲染所有样式分区', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('BorderTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=2. 不同边框样式')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 不同边框颜色')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 统一圆角')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 不等圆角')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=6. 边框+圆角组合')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=7. 边框+背景色')).toBeVisible();

    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);
  });
});
