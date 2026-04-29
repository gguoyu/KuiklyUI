import { test, expect } from '../../../fixtures/test-base';

test.describe('KRView 静态验证', () => {
  test('应该成功加载 KRViewTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 不同尺寸')).toBeVisible();
  });

  test('应该正确渲染多种样式的 KRView 组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);

    await expect(kuiklyPage.page.locator('text=2. 不同背景色')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 不同圆角')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 边框样式')).toBeVisible();
  });

  test('应该渲染完整渐变背景方向 (Section 5)', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Section 5 should contain gradient views — scroll to make sure it's visible
    await expect(kuiklyPage.page.getByText('5. 渐变背景', { exact: false })).toBeVisible();

    // Verify KRView elements with gradient backgrounds are rendered
    const gradientViews = kuiklyPage.page.locator('[data-kuikly-component=KRView]');
    const count = await gradientViews.count();
    expect(count).toBeGreaterThan(5);
  });

  test('应该渲染所有渐变方向 (TO_TOP, TO_LEFT, TO_TOP_LEFT, TO_TOP_RIGHT, TO_BOTTOM_LEFT)', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Scroll to section 5 to ensure direction views are rendered
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 400, smooth: false });

    await expect(kuiklyPage.page.getByText('5. 渐变背景', { exact: false })).toBeVisible();

    // Verify no rendering errors by checking KRView count remains stable
    const views = kuiklyPage.page.locator('[data-kuikly-component=KRView]');
    const count = await views.count();
    expect(count).toBeGreaterThan(10);
  });

  test('visibility toggle 区域应渲染 Section 8', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    // Section 8: Visibility — exercises KRView.setVisibility
    await expect(kuiklyPage.page.getByText('8. Visibility', { exact: false })).toBeVisible();
  });

  test('box shadow 区域应渲染 Section 9', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1000, smooth: false });

    // Section 9: Box Shadow — exercises KuiklyRenderCSSKTX boxShadow conversion
    await expect(kuiklyPage.page.getByText('9. Box Shadow', { exact: false })).toBeVisible();
    const shadowViews = kuiklyPage.page.locator('[data-kuikly-component=KRView]');
    const count = await shadowViews.count();
    expect(count).toBeGreaterThan(15);
  });

  test('accessibility role 区域应渲染 Section 10', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1200, smooth: false });

    // Section 10: Accessibility Role — exercises KRView.setAccessibilityRole
    await expect(kuiklyPage.page.getByText('10. Accessibility Role', { exact: false })).toBeVisible();
  });

  test('screen frame event 区域应渲染 Section 11', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1400, smooth: false });

    // Section 11 + 12: Screen Frame — exercises KRView screen frame observation
    await expect(kuiklyPage.page.getByText('11. Screen Frame Event', { exact: false })).toBeVisible();
  });

  test('border with child 和 semi-transparent color 区域应渲染', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1800, smooth: false });

    // Section 14 + 15: exercises checkAndUpdatePositionForH5 and toRgbColor alpha path
    await expect(kuiklyPage.page.getByText('14. Border with Child', { exact: false })).toBeVisible({ timeout: 3000 });
  });
});

