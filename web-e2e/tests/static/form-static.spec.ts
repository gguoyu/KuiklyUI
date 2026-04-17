import { test, expect } from '../../fixtures/test-base';

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

test.describe('FormTestPage static', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('FormTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('应该成功加载 FormTestPage 并渲染所有字段标签', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('用户信息表单')).toBeVisible();
    await expect(kuiklyPage.page.getByText('请填写以下信息，带 * 为必填项')).toBeVisible();
    await expect(kuiklyPage.page.getByText('* 姓名')).toBeVisible();
    await expect(kuiklyPage.page.getByText('* 邮箱')).toBeVisible();
    await expect(kuiklyPage.page.getByText('手机号')).toBeVisible();
    await expect(kuiklyPage.page.getByText('备注')).toBeVisible();
    await expect(kuiklyPage.page.getByText('订阅产品更新邮件')).toBeVisible();
    await expect(kuiklyPage.page.getByText('我已阅读并同意用户协议')).toBeVisible();
  });

  test('初始状态提交按钮应为灰色（未同意协议）', async ({ kuiklyPage }) => {
    const bg = await getSubmitBtnBg(kuiklyPage.page);
    expect(bg).toMatch(/187|190|184|bbb/i);
  });
});
