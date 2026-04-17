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
      if (htmlEl.innerText?.trim() === '提交表单') {
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

  test('fill() 姓名和邮箱后输入框应有内容显示', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('请输入姓名').fill('张三');
    await kuiklyPage.page.getByPlaceholder('请输入邮箱地址').fill('zhangsan@example.com');
    await kuiklyPage.waitForRenderComplete();

    const nameVal = await kuiklyPage.page.getByPlaceholder('请输入姓名').inputValue();
    const emailVal = await kuiklyPage.page.getByPlaceholder('请输入邮箱地址').inputValue();
    expect(nameVal).toBe('张三');
    expect(emailVal).toBe('zhangsan@example.com');
  });

  test('fill() 手机号后 input value 应正确', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('请输入手机号（选填）').fill('13800138000');
    await kuiklyPage.waitForRenderComplete();

    const val = await kuiklyPage.page.getByPlaceholder('请输入手机号（选填）').inputValue();
    expect(val).toBe('13800138000');
  });

  test('点击协议开关后提交按钮应变为蓝色', async ({ kuiklyPage }) => {
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

  test('点击订阅开关应改变其背景色', async ({ kuiklyPage }) => {
    const toggles = await getToggleCenters(kuiklyPage.page);
    expect(toggles.length).toBeGreaterThanOrEqual(1);

    const subscribeToggle = toggles[0];
    const bgBefore = await getBgAtCoord(kuiklyPage.page, subscribeToggle.cx, subscribeToggle.cy);

    await kuiklyPage.page.mouse.click(subscribeToggle.cx, subscribeToggle.cy);
    await kuiklyPage.waitForRenderComplete();

    const bgAfter = await getBgAtCoord(kuiklyPage.page, subscribeToggle.cx, subscribeToggle.cy);
    expect(bgAfter).not.toBe(bgBefore);
  });

  test('完整填写并同意协议后点击提交应无报错', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('请输入姓名').fill('张三');
    await kuiklyPage.page.getByPlaceholder('请输入邮箱地址').fill('zhangsan@example.com');
    await kuiklyPage.waitForRenderComplete();

    const toggles = await getToggleCenters(kuiklyPage.page);
    if (toggles.length >= 2) {
      await kuiklyPage.page.mouse.click(toggles[1].cx, toggles[1].cy);
      await kuiklyPage.waitForRenderComplete();
    }

    await kuiklyPage.page.getByText('提交表单').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('提交表单')).toBeVisible();
  });

  test('重置按钮点击后页面不报错且提交按钮可见', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByPlaceholder('请输入姓名').fill('李四');
    await kuiklyPage.page.getByPlaceholder('请输入邮箱地址').fill('lisi@test.com');
    await kuiklyPage.waitForRenderComplete();

    const toggles = await getToggleCenters(kuiklyPage.page);
    if (toggles.length >= 2) {
      await kuiklyPage.page.mouse.click(toggles[1].cx, toggles[1].cy);
      await kuiklyPage.waitForRenderComplete();
    }

    const bgBeforeReset = await getSubmitBtnBg(kuiklyPage.page);
    expect(bgBeforeReset).toMatch(/33|150|243/);

    await kuiklyPage.page.getByText('重置').click();
    await kuiklyPage.waitForRenderComplete();

    const bgAfterReset = await getSubmitBtnBg(kuiklyPage.page);
    expect(bgAfterReset).toMatch(/187|bbb/i);
    await expect(kuiklyPage.page.getByText('提交表单')).toBeVisible();
    await expect(kuiklyPage.page.getByText('重置')).toBeVisible();
  });
});
