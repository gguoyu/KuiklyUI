/**
 * L0 静态渲染测试：KRActivityIndicatorView 加载与样式验证
 */

import { test, expect } from '../../../fixtures/test-base';

test.describe('KRActivityIndicatorView 渲染测试', () => {
  test('应该成功加载 ActivityIndicatorExamplePage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ActivityIndicatorExamplePage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=ActivityIndicator Example')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=活动指示器-白色style').first()).toBeVisible();
    await expect(kuiklyPage.page.locator('text=活动指示器-灰色style')).toBeVisible();
  });

  test('白色与灰色 activity indicator 应渲染不同底图并保持旋转动画', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ActivityIndicatorExamplePage');
    await kuiklyPage.waitForRenderComplete();

    const indicators = kuiklyPage.page.locator('[data-kuikly-component="KRActivityIndicatorView"]');
    await expect(indicators).toHaveCount(2);

    const styles = await indicators.evaluateAll((elements) =>
      elements.map((el) => {
        const style = window.getComputedStyle(el as HTMLElement);
        return {
          width: style.width,
          height: style.height,
          animation: style.animation,
          backgroundImage: style.backgroundImage,
          backgroundSize: style.backgroundSize,
        };
      }),
    );

    styles.forEach((style) => {
      expect(style.width).toBe('20px');
      expect(style.height).toBe('20px');
      expect(style.animation).toContain('activityIndicatorRotate');
      expect(style.backgroundSize).toBe('contain');
      expect(style.backgroundImage).toContain('data:image/png;base64');
    });

    expect(styles[0].backgroundImage).not.toBe(styles[1].backgroundImage);
  });
});
