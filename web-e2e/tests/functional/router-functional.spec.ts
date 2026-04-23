import { test, expect } from '../../fixtures/test-base';

test.describe('RouterTestPage functional 验证', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RouterTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.evaluate(() => localStorage.clear());
    await kuiklyPage.page.reload({ waitUntil: 'networkidle' });
    await kuiklyPage.waitForRenderComplete();
  });

  test('输入 pageName 后点击跳转应写入缓存并打开目标页面', async ({ kuiklyPage }) => {
    const input = kuiklyPage.page.locator('input').first();
    await expect(input).toHaveAttribute('placeholder', '输入pageName（不区分大小写）');

    await input.fill('RouterTestPage');
    const popupPromise = kuiklyPage.page.waitForEvent('popup');
    await kuiklyPage.page.getByText('跳转', { exact: true }).click();

    const popup = await popupPromise;
    await popup.waitForLoadState('networkidle');

    await expect.poll(() => popup.url()).toContain('page_name=RouterTestPage');
    await expect
      .poll(() => kuiklyPage.page.evaluate(() => localStorage.getItem('router_test_last_input')))
      .toBe('RouterTestPage');

    await popup.close();
  });

  test('重新加载后应回填缓存输入，并在跳转时保留额外参数', async ({ kuiklyPage }) => {
    const initialInput = kuiklyPage.page.locator('input').first();
    await initialInput.fill('RouterTestPage&debug=true');

    const firstPopupPromise = kuiklyPage.page.waitForEvent('popup');
    await kuiklyPage.page.getByText('跳转', { exact: true }).click();
    const firstPopup = await firstPopupPromise;
    await firstPopup.waitForLoadState('networkidle');
    await firstPopup.close();

    await kuiklyPage.page.reload({ waitUntil: 'networkidle' });
    await kuiklyPage.waitForRenderComplete();

    const reloadedInput = kuiklyPage.page.locator('input').first();
    await expect(reloadedInput).toHaveValue('RouterTestPage&debug=true');

    const secondPopupPromise = kuiklyPage.page.waitForEvent('popup');
    await kuiklyPage.page.getByText('跳转', { exact: true }).click();
    const secondPopup = await secondPopupPromise;
    await secondPopup.waitForLoadState('networkidle');

    await expect.poll(() => secondPopup.url()).toContain('page_name=RouterTestPage');
    await expect.poll(() => secondPopup.url()).toContain('debug=true');
    await expect
      .poll(() => kuiklyPage.page.evaluate(() => localStorage.getItem('router_test_last_input')))
      .toBe('RouterTestPage&debug=true');

    await secondPopup.close();
  });
});
