import { test, expect } from '../../../fixtures/test-base';

test.describe('Transform static 验证', () => {
  test('应该成功加载 TransformTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. Rotate 旋转')).toBeVisible();
  });

  test('应该正确渲染旋转变换', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('0°', { exact: true }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('45°', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('90°', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('180°', { exact: true })).toBeVisible();
  });

  test('应该正确渲染缩放变换', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=2. Scale 缩放')).toBeVisible();
    await expect(kuiklyPage.page.getByText('0.5', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('1.0', { exact: true }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('1.5', { exact: true })).toBeVisible();
  });

  test('应该正确渲染倾斜和平移与组合变换', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=3. Skew 倾斜')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. Translate 平移')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=5. 组合变换')).toBeVisible();
    await expect(kuiklyPage.page.getByText('R+S', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('R+K', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('S+K', { exact: true })).toBeVisible();
  });
});
