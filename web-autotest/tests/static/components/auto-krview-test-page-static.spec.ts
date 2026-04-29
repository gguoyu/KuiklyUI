import { test, expect } from '../../../fixtures/test-base';

test.describe('Auto KRViewTestPage static 验证', () => {
  test('should render KRViewTestPage stably', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 不同尺寸', { exact: false }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 不同背景色', { exact: false }).first()).toBeVisible();
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('should render visibility, box-shadow, accessibility-role sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await expect(kuiklyPage.page.getByText('8. Visibility', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('show', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('after-hidden', { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(list, { deltaY: 300, smooth: false });
    await expect(kuiklyPage.page.getByText('9. Box Shadow', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('shadow', { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(list, { deltaY: 200, smooth: false });
    await expect(kuiklyPage.page.getByText('10. Accessibility Role', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('accessibility-role-button', { exact: true })).toBeVisible();
  });

  test('should render screen frame and screen frame pause sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1200, smooth: false });

    await expect(kuiklyPage.page.getByText('11. Screen Frame Event', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('frame-count:', { exact: false }).first()).toBeVisible();

    await kuiklyPage.scrollInContainer(list, { deltaY: 200, smooth: false });
    await expect(kuiklyPage.page.getByText('12. Screen Frame Pause', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('pause-frames', { exact: true })).toBeVisible();
  });

  test('screen frame pause toggle should switch between pause and resume', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1400, smooth: false });

    await expect(kuiklyPage.page.getByText('pause-frames', { exact: true })).toBeVisible();
    await kuiklyPage.page.getByText('pause-frames', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('resume-frames', { exact: true })).toBeVisible();
  });
});
