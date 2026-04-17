import { test, expect } from '../../fixtures/test-base';

test.describe('Modal 视觉验证', () => {
  test('视觉回归：ModalTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('modal-test-initial.png', {
      maxDiffPixels: 300,
    });
  });
});
