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

  test('visual regression: FormTestPage initial state', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page).toHaveScreenshot('form-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('visual regression: FormTestPage filled and agreed', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('enter name').fill('Alice');
    await kuiklyPage.page.getByPlaceholder('enter email').fill('alice@example.com');
    await kuiklyPage.page.getByPlaceholder('enter phone (optional)').fill('13800138000');
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
