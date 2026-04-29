import { test, expect } from '../../../fixtures/test-base';

test.describe('KRTextFieldView functional 验证', () => {
  test('textLengthBeyondLimit 回调应在输入超过最大长度时触发', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextFieldViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Text Length Limit Callback', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('beyond-limit-count:0', { exact: false })).toBeVisible();

    // Use the first input with placeholder "max 5 chars" which has textLengthBeyondLimit handler
    const limitedInput = kuiklyPage.page.locator('input[placeholder="max 5 chars"]').first();
    await expect(limitedInput).toBeVisible();

    await limitedInput.click();
    await limitedInput.fill('abcdef');
    await kuiklyPage.page.waitForTimeout(500);

    // beyond-limit-count should have increased
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /beyond-limit-count:(?!0)/ }).first())
      .toBeVisible({ timeout: 5000 });
  });
});
