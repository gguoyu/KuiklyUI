import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCanvasView visual 验证', () => {
  test('视觉回归：KRCanvasViewTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRCanvasViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(1000);

    await expect(kuiklyPage.page).toHaveScreenshot('krcanvas-test.png', {
      maxDiffPixels: 200,
    });
  });
});
