import { test, expect } from '../../fixtures/test-base';

test.describe('Gesture 视觉验证', () => {
  test('视觉回归：GestureTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('gesture-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：GestureTestPage 交互后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('区域 A').click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.getByText('快速点击此区域').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('gesture-test-after-interaction.png', {
      maxDiffPixels: 300,
    });
  });
});
