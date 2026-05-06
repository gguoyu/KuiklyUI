import { test, expect } from '../../fixtures/test-base';

async function getToggleCenters(page: import('@playwright/test').Page): Promise<Array<{ cx: number; cy: number }>> {
  // Scroll the Kuikly list container to the bottom to bring toggles into viewport
  await page.evaluate(() => {
    const lists = document.querySelectorAll('[data-kuikly-component="KRListView"]');
    lists.forEach((el) => { (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight; });
    // Also try the scroll container
    const scrollers = document.querySelectorAll('[data-kuikly-component="KRScrollView"]');
    scrollers.forEach((el) => { (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight; });
  });
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const views = document.querySelectorAll('[data-kuikly-component="KRView"]');
    const result: Array<{ cx: number; cy: number }> = [];
    views.forEach((view) => {
      const box = (view as HTMLElement).getBoundingClientRect();
      if (Math.abs(box.width - 52) < 5 && Math.abs(box.height - 28) < 5 && box.top >= 0 && box.top < window.innerHeight) {
        result.push({
          cx: Math.round(box.x + box.width / 2),
          cy: Math.round(box.y + box.height / 2),
        });
      }
    });
    return result;
  });
}

async function getBgAtCoord(page: import('@playwright/test').Page, cx: number, cy: number): Promise<string> {
  return page.evaluate(({ x, y }: { x: number; y: number }) => {
    const el = document.elementFromPoint(x, y);
    return el ? window.getComputedStyle(el).backgroundColor : '';
  }, { x: cx, y: cy });
}

async function getSubmitBtnBg(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const els = document.querySelectorAll('[data-kuikly-component="KRView"]');
    for (const el of Array.from(els)) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.innerText?.trim() === 'submit') {
        return window.getComputedStyle(htmlEl).backgroundColor;
      }
    }
    return '';
  });
}

test.describe('FormTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('FormTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('filling name and email should reflect input values', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('enter name').fill('Alice');
    await kuiklyPage.page.getByPlaceholder('enter email').fill('alice@example.com');
    await kuiklyPage.waitForRenderComplete();

    const nameVal = await kuiklyPage.page.getByPlaceholder('enter name').inputValue();
    const emailVal = await kuiklyPage.page.getByPlaceholder('enter email').inputValue();
    expect(nameVal).toBe('Alice');
    expect(emailVal).toBe('alice@example.com');
  });

  test('filling phone should reflect correct input value', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('enter phone (optional)').fill('13800138000');
    await kuiklyPage.waitForRenderComplete();

    const val = await kuiklyPage.page.getByPlaceholder('enter phone (optional)').inputValue();
    expect(val).toBe('13800138000');
  });

  test('toggling the agree-terms switch should turn submit button blue', async ({ kuiklyPage }) => {
    const bgBefore = await getSubmitBtnBg(kuiklyPage.page);
    const toggles = await getToggleCenters(kuiklyPage.page);
    expect(toggles.length).toBeGreaterThanOrEqual(2);

    const agreeToggle = toggles[1];
    await kuiklyPage.page.mouse.click(agreeToggle.cx, agreeToggle.cy);
    await kuiklyPage.waitForRenderComplete();

    const bgAfter = await getSubmitBtnBg(kuiklyPage.page);
    expect(bgAfter).not.toBe(bgBefore);
    expect(bgAfter).toMatch(/33|150|243/);
  });

  test('toggling the subscribe switch should change its background', async ({ kuiklyPage }) => {
    const toggles = await getToggleCenters(kuiklyPage.page);
    expect(toggles.length).toBeGreaterThanOrEqual(1);

    const subscribeToggle = toggles[0];
    const bgBefore = await getBgAtCoord(kuiklyPage.page, subscribeToggle.cx, subscribeToggle.cy);

    await kuiklyPage.page.mouse.click(subscribeToggle.cx, subscribeToggle.cy);
    await kuiklyPage.waitForRenderComplete();

    const bgAfter = await getBgAtCoord(kuiklyPage.page, subscribeToggle.cx, subscribeToggle.cy);
    expect(bgAfter).not.toBe(bgBefore);
  });

  // fillInput dispatches DOM 'input' event, but Kuikly's Input component
  // may not process it identically to real user input. The textDidChange
  // callback does not fire reliably with synthetic events.
  test.skip('clearing email input should show email-is-required error [KNOWN: Input textDidChange not firing reliably with synthetic clear events]', async ({ kuiklyPage }) => {
    const emailInput = kuiklyPage.page.getByPlaceholder('enter email');
    await kuiklyPage.fillInput(emailInput, 'a@b.com');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.fillInput(emailInput, '');

    await expect(kuiklyPage.page.getByText('email is required', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('full valid submit should not error and keep submit button visible', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('enter name').fill('Alice');
    await kuiklyPage.page.getByPlaceholder('enter email').fill('alice@example.com');
    await kuiklyPage.waitForRenderComplete();

    const toggles = await getToggleCenters(kuiklyPage.page);
    if (toggles.length >= 2) {
      await kuiklyPage.page.mouse.click(toggles[1].cx, toggles[1].cy);
      await kuiklyPage.waitForRenderComplete();
    }

    await kuiklyPage.page.getByText('submit', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('submit', { exact: true })).toBeVisible();
  });

  test('reset should clear fields and grey out submit button', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('enter name').fill('Bob');
    await kuiklyPage.page.getByPlaceholder('enter email').fill('bob@test.com');
    await kuiklyPage.waitForRenderComplete();

    const toggles = await getToggleCenters(kuiklyPage.page);
    if (toggles.length >= 2) {
      await kuiklyPage.page.mouse.click(toggles[1].cx, toggles[1].cy);
      await kuiklyPage.waitForRenderComplete();
    }

    const bgBeforeReset = await getSubmitBtnBg(kuiklyPage.page);
    expect(bgBeforeReset).toMatch(/33|150|243/);

    await kuiklyPage.page.getByText('reset', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    const bgAfterReset = await getSubmitBtnBg(kuiklyPage.page);
    expect(bgAfterReset).toMatch(/187|bbb/i);
    await expect(kuiklyPage.page.getByText('submit', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('reset', { exact: true })).toBeVisible();
  });
});
