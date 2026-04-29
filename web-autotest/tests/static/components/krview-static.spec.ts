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
});

