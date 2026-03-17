/**
 * L0 静态渲染测试：Overflow 溢出渲染验证
 *
 * 测试页面：OverflowTestPage
 * 测试覆盖：
 * 1. 页面加载成功
 * 2. overflow 裁剪模式渲染
 * 3. overflow 溢出模式渲染
 * 4. borderRadius + overflow 圆角裁剪
 * 5. 不等圆角裁剪
 * 6. 视觉回归截图对比
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('Overflow 溢出渲染测试', () => {
  test('应该成功加载 OverflowTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OverflowTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. overflow裁剪')).toBeVisible();
  });

  test('应该正确渲染裁剪和溢出模式', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OverflowTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证裁剪/溢出分区标题
    await expect(kuiklyPage.page.locator('text=子元素超出部分被裁剪')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. overflow溢出')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=子元素超出部分可见')).toBeVisible();

    // 验证 KRView 组件正确渲染
    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);
    console.log(`OverflowTestPage 渲染了 ${views.length} 个 KRView 组件`);
  });

  test('应该正确渲染圆角裁剪组合', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OverflowTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 验证分区标题
    await expect(kuiklyPage.page.locator('text=3. 圆角+裁剪组合')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=圆角容器裁剪超出的子元素')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=4. 不等圆角裁剪')).toBeVisible();

    // 验证圆形裁剪的文本标签
    await expect(kuiklyPage.page.getByText('圆形裁剪', { exact: true })).toBeVisible();
  });

  test('视觉回归：OverflowTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('OverflowTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page).toHaveScreenshot('overflow-test.png', {
      maxDiffPixels: 100,
    });
  });
});
