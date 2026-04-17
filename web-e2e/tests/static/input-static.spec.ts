import { test, expect } from '../../fixtures/test-base';

test.describe('Input 静态验证', () => {
  test('应该成功加载 InputTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 单行文本输入')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. 密码输入')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=3. 数字输入')).toBeVisible();
  });

  test('应该正确渲染输入框组件', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    const inputViews = kuiklyPage.page.locator('[data-kuikly-component="KRTextFieldView"]');
    const textAreaViews = kuiklyPage.page.locator('[data-kuikly-component="KRTextAreaView"]');
    const inputs = kuiklyPage.page.locator('input');
    const textArea = kuiklyPage.page.locator('textarea');

    await expect(inputViews).toHaveCount(4);
    await expect(textAreaViews).toHaveCount(1);
    await expect(inputs).toHaveCount(4);
    await expect(textArea).toHaveCount(1);
  });

  test('输入框初始类型与占位符应正确', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    const inputs = kuiklyPage.page.locator('input');
    const textArea = kuiklyPage.page.locator('textarea');

    await expect(inputs.nth(0)).toHaveAttribute('placeholder', '请输入文本');
    await expect(inputs.nth(1)).toHaveAttribute('type', 'password');
    await expect(inputs.nth(2)).toHaveAttribute('type', 'number');
    await expect(textArea).toHaveAttribute('placeholder', '请输入多行文本...');
  });
});

test.describe('maxLength 页面静态验证', () => {
  test('应渲染多组 input 与 textarea 最大长度示例', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('maxLength');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=maxTextLength接口Demo')).toBeVisible();

    const inputs = kuiklyPage.page.locator('input');
    const textareas = kuiklyPage.page.locator('textarea');
    await expect(inputs).toHaveCount(4);
    await expect(textareas).toHaveCount(4);

    const maxlengths = await kuiklyPage.page.evaluate(() => ({
      inputs: Array.from(document.querySelectorAll('input')).map((element) => element.getAttribute('maxlength')),
      textareas: Array.from(document.querySelectorAll('textarea')).map((element) => element.getAttribute('maxlength')),
    }));

    expect(maxlengths.inputs).toEqual(['10', '10', '10', '10']);
    expect(maxlengths.textareas).toEqual(['20', '20', '20', '20']);
  });
});
