import { test, expect } from '../../fixtures/test-base';

test.describe('Gesture visual', () => {
  test('visual regression: GestureTestPage initial state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('gesture-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('visual regression: GestureTestPage after interaction', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('zone-a', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.getByText('tap here', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('gesture-test-after-interaction.png', {
      maxDiffPixels: 300,
    });
  });
});
