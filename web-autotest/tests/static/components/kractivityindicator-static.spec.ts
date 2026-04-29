import { test, expect } from '../../../fixtures/test-base';

test.describe('KRActivityIndicatorView static 验证', () => {
  test('应该成功加载 KRActivityIndicatorTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRActivityIndicatorTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('KRActivityIndicatorTestPage', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('1. 白色样式', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 灰色样式', { exact: false })).toBeVisible();
  });

  test('白色与灰色 activity indicator 应渲染不同底图并保持旋转动画', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRActivityIndicatorTestPage');
    await kuiklyPage.waitForRenderComplete();

    const indicators = kuiklyPage.page.locator('[data-kuikly-component="KRActivityIndicatorView"]');
    await expect(indicators).toHaveCount(2);

    const styles = await indicators.evaluateAll((elements) =>
      elements.map((element) => {
        const style = window.getComputedStyle(element as HTMLElement);
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
