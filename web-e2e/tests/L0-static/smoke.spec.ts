/**
 * L0 冒烟测试：验证基础设施是否打通
 * 
 * 测试目标：
 * 1. 验证 KuiklyPage fixture 是否正常工作
 * 2. 验证 data-kuikly-component 属性是否被正确注入
 * 3. 验证视觉回归测试能力
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('L0 冒烟测试套件', () => {
  test('应该成功加载 ComposeRoutePager 页面', async ({ kuiklyPage }) => {
    // 访问页面
    await kuiklyPage.goto('crouter');

    // 等待渲染完成
    await kuiklyPage.waitForRenderComplete();

    // 验证页面标题存在
    await expect(kuiklyPage.page.locator('text=Kuikly页面路由')).toBeVisible();
  });

  test('应该正确注入 data-kuikly-component 属性', async ({ kuiklyPage }) => {
    // 访问页面
    await kuiklyPage.goto('crouter');
    await kuiklyPage.waitForRenderComplete();

    // 查找所有带有 data-kuikly-component 属性的元素
    const components = await kuiklyPage.page.locator('[data-kuikly-component]').all();

    // 验证至少有一个组件被渲染
    expect(components.length).toBeGreaterThan(0);

    // 打印找到的组件类型（用于调试）
    console.log(`找到 ${components.length} 个 Kuikly 组件`);
    for (const comp of components.slice(0, 5)) { // 只打印前5个
      const componentType = await comp.getAttribute('data-kuikly-component');
      console.log(`  - ${componentType}`);
    }
  });

  test('应该支持组件选择器定位元素', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('crouter');
    await kuiklyPage.waitForRenderComplete();

    // 使用 components() 方法获取所有匹配的元素（返回数组）
    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);

    console.log(`通过 components() 找到 ${views.length} 个 KRView 组件`);
    
    // 也测试 component() 方法（返回 Locator）
    const viewLocator = kuiklyPage.component('KRView');
    expect(await viewLocator.count()).toBeGreaterThan(0);
  });

  test('视觉回归：ComposeRoutePager 页面截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('crouter');
    await kuiklyPage.waitForRenderComplete();

    // 等待页面完全加载（给图片等资源一些时间）
    await kuiklyPage.page.waitForTimeout(1000);

    // 进行视觉回归测试
    await expect(kuiklyPage.page).toHaveScreenshot('crouter-page.png', {
      maxDiffPixels: 100, // 允许最多 100 像素的差异
    });
  });

  test('应该能够获取组件层级结构', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('crouter');
    await kuiklyPage.waitForRenderComplete();

    // 获取所有组件及其层级
    const hierarchy = await kuiklyPage.page.evaluate(() => {
      const components = document.querySelectorAll('[data-kuikly-component]');
      return Array.from(components).map(el => ({
        type: el.getAttribute('data-kuikly-component'),
        id: el.id,
        tagName: el.tagName,
      }));
    });

    expect(hierarchy.length).toBeGreaterThan(0);
    console.log('组件层级结构：', JSON.stringify(hierarchy.slice(0, 10), null, 2));
  });
});
