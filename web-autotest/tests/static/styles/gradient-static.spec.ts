import { test, expect } from '../../../fixtures/test-base';

test.describe('Gradient static 验证', () => {
  test('应成功加载 GradientTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 水平渐变', { exact: false })).toBeVisible();
  });

  test('应渲染水平和垂直渐变标签', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('TO_RIGHT', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('TO_LEFT', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('TO_BOTTOM', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('TO_TOP', { exact: true })).toBeVisible();
  });

  test('应渲染对角渐变标签', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('3. 对角渐变', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('↘', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('↙', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('↗', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('↖', { exact: true })).toBeVisible();
  });

  test('应渲染多色渐变与圆角组合标签', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GradientTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('4. 多色渐变', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. 渐变+圆角组合', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('三色渐变', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('四色渐变', { exact: true })).toBeVisible();
  });
});
