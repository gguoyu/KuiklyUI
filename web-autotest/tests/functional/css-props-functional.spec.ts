import { test, expect } from '../../fixtures/test-base';

test.describe('CSSPropsTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSPropsTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('page renders all CSS prop sections', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('1. Text Shadow')).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. Stroke Width and Color')).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Touch Enable Toggle')).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. Asymmetric Border Radius')).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. Overflow Hidden vs Visible')).toBeVisible();
  });

  test('toggling touch-enabled state triggers touchEnable CSS prop handler', async ({ kuiklyPage }) => {
    // Initial state
    await expect(kuiklyPage.page.getByText('touch-enabled', { exact: true })).toBeVisible();

    // Click toggle — sets touchEnable(false) on the target view, exercising TOUCH_ENABLE handler
    await kuiklyPage.page.getByText('touch-enabled', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('touch-disabled', { exact: true })).toBeVisible();

    // Click toggle again — sets touchEnable(true)
    await kuiklyPage.page.getByText('touch-disabled', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('touch-enabled', { exact: true })).toBeVisible();
  });

  test('asymmetric border radius renders without error', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('asymmetric-radius')).toBeVisible();
    await expect(kuiklyPage.page.getByText('uniform-radius')).toBeVisible();
  });

  test('overflow variants render correctly', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('overflow-hidden')).toBeVisible();
    await expect(kuiklyPage.page.getByText('overflow-visible')).toBeVisible();
  });

  test('z-index views render with zIndex prop applied', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 600, smooth: false });
    await expect(kuiklyPage.page.getByText('6. Z-Index')).toBeVisible();
    await expect(kuiklyPage.page.getByText('zindex-10', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('zindex-1', { exact: true })).toBeVisible();
  });

  test('accessibility label view renders with accessibility prop applied', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });
    await expect(kuiklyPage.page.getByText('7. Accessibility')).toBeVisible();
    await expect(kuiklyPage.page.getByText('accessibility-label-button')).toBeVisible();
  });
});
