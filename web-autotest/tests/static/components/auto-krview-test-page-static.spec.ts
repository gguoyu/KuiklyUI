import { test, expect } from '../../../fixtures/test-base';

test.describe('Auto KRViewTestPage static 验证', () => {
  test('should render KRViewTestPage stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 不同尺寸').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 不同背景色').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('should render visibility, box-shadow, accessibility-role sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await expect(kuiklyPage.page.getByText('8. Visibility')).toBeVisible();
    await expect(kuiklyPage.page.getByText('show', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('after-hidden', { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(list, { deltaY: 300, smooth: false });
    await expect(kuiklyPage.page.getByText('9. Box Shadow')).toBeVisible();
    await expect(kuiklyPage.page.getByText('shadow', { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(list, { deltaY: 200, smooth: false });
    await expect(kuiklyPage.page.getByText('10. Accessibility Role')).toBeVisible();
    await expect(kuiklyPage.page.getByText('accessibility-role-button', { exact: true })).toBeVisible();
  });
});
