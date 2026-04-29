import { test, expect } from '../../fixtures/test-base';

test.describe('点击交互视觉验证', () => {
  test('视觉回归：ClickTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('click-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：ClickTestPage 交互后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('点击我', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    const plusButton = kuiklyPage.page.getByText('+', { exact: true });
    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('推荐', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('click-test-after-interaction.png', {
      maxDiffPixels: 300,
    });
  });
});
