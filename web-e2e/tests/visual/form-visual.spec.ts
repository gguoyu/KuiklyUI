import { test, expect } from '../../fixtures/test-base';

async function getToggleCenters(page: import('@playwright/test').Page): Promise<Array<{ cx: number; cy: number }>> {
  return page.evaluate(() => {
    const views = document.querySelectorAll('[data-kuikly-component="KRView"]');
    const result: Array<{ cx: number; cy: number }> = [];
    views.forEach((view) => {
      const box = (view as HTMLElement).getBoundingClientRect();
      if (Math.abs(box.width - 52) < 5 && Math.abs(box.height - 28) < 5 && box.y > 0) {
        result.push({
          cx: Math.round(box.x + box.width / 2),
          cy: Math.round(box.y + box.height / 2),
        });
      }
    });
    return result;
  });
}

test.describe('FormTestPage visual', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('FormTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('视觉回归：FormTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page).toHaveScreenshot('form-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：FormTestPage 填写并同意协议截图', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('请输入姓名').fill('李四');
    await kuiklyPage.page.getByPlaceholder('请输入邮箱地址').fill('lisi@example.com');
    await kuiklyPage.page.getByPlaceholder('请输入手机号（选填）').fill('13800138000');
    await kuiklyPage.waitForRenderComplete();

    const toggles = await getToggleCenters(kuiklyPage.page);
    if (toggles.length >= 2) {
      await kuiklyPage.page.mouse.click(toggles[1].cx, toggles[1].cy);
      await kuiklyPage.waitForRenderComplete();
    }

    await expect(kuiklyPage.page).toHaveScreenshot('form-test-filled-agreed.png', {
      maxDiffPixels: 300,
    });
  });
});
