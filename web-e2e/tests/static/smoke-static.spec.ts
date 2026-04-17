import { test, expect } from '../../fixtures/test-base';

test.describe('Smoke static 验证', () => {
  test('应成功加载 SmokeTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SmokeTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Smoke')).toBeVisible();
  });

  test('应注入 data-kuikly-component 属性', async ({ kuiklyPage }) => {
    test.slow();

    await kuiklyPage.goto('SmokeTestPage');
    await kuiklyPage.waitForRenderComplete();

    const components = kuiklyPage.page.locator('[data-kuikly-component]');
    const componentCount = await components.count();

    expect(componentCount).toBeGreaterThan(0);

    for (let index = 0; index < Math.min(componentCount, 5); index += 1) {
      const componentType = await components.nth(index).getAttribute('data-kuikly-component');
      expect(componentType).toBeTruthy();
    }
  });

  test('应支持组件选择器定位元素', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SmokeTestPage');
    await kuiklyPage.waitForRenderComplete();

    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);

    const viewLocator = kuiklyPage.component('KRView');
    expect(await viewLocator.count()).toBeGreaterThan(0);
  });

  test('应能够读取组件层级结构', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SmokeTestPage');
    await kuiklyPage.waitForRenderComplete();

    const hierarchy = await kuiklyPage.page.evaluate(() => {
      const components = document.querySelectorAll('[data-kuikly-component]');
      return Array.from(components).map((el) => ({
        type: el.getAttribute('data-kuikly-component'),
        id: el.id,
        tagName: el.tagName,
      }));
    });

    expect(hierarchy.length).toBeGreaterThan(0);
    expect(hierarchy[0]?.type).toBeTruthy();
  });
});
