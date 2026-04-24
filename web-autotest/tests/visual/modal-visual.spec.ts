import { test, expect } from '../../fixtures/test-base';

test.describe('Modal visual', () => {
  test('visual regression: ModalTestPage initial state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ModalTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('modal-test-initial.png', {
      maxDiffPixels: 300,
    });
  });
});
