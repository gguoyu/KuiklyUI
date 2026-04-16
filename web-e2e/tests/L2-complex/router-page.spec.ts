/**
 * L2 复杂交互测试：RouterPage 路由与缓存链路验证
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('RouterPage 路由模块测试', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.page.goto('http://localhost:8080/?page_name=router');
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.evaluate(() => localStorage.clear());
  });

  test('输入 pageName 后点击跳转应写入缓存并打开目标页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('router');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.locator('input').first();
    await expect(input).toHaveAttribute('placeholder', '输入pageName（不区分大小写）');

    await input.fill('router');
    const popupPromise = kuiklyPage.page.waitForEvent('popup');
    await kuiklyPage.page.getByText('跳转').click();

    const popup = await popupPromise;
    await popup.waitForLoadState('networkidle');

    await expect.poll(() => popup.url()).toContain('page_name=router');
    await expect
      .poll(() => kuiklyPage.page.evaluate(() => localStorage.getItem('router_last_input_key2')))
      .toBe('router');

    await popup.close();
  });

  test('重新加载后应回填缓存输入，并在跳转时保留额外参数', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('router');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.locator('input').first();
    await input.fill('router&debug=true');

    const firstPopupPromise = kuiklyPage.page.waitForEvent('popup');
    await kuiklyPage.page.getByText('跳转').click();
    const firstPopup = await firstPopupPromise;
    await firstPopup.waitForLoadState('networkidle');
    await firstPopup.close();

    await kuiklyPage.page.reload({ waitUntil: 'networkidle' });
    await kuiklyPage.waitForRenderComplete();
    await expect(input).toHaveValue('router&debug=true');

    const secondPopupPromise = kuiklyPage.page.waitForEvent('popup');
    await kuiklyPage.page.getByText('跳转').click();
    const secondPopup = await secondPopupPromise;
    await secondPopup.waitForLoadState('networkidle');

    await expect.poll(() => secondPopup.url()).toContain('page_name=router');
    await expect.poll(() => secondPopup.url()).toContain('debug=true');
    await expect
      .poll(() => kuiklyPage.page.evaluate(() => localStorage.getItem('router_last_input_key2')))
      .toBe('router&debug=true');

    await secondPopup.close();
  });
});
