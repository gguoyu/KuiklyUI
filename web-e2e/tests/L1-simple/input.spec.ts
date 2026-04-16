/**
 * L1 简单交互测试：输入框交互验证
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('InputTestPage 基础交互测试', () => {
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

    await expect(inputViews).toHaveCount(4);
    await expect(textAreaViews).toHaveCount(1);

    const inputs = kuiklyPage.page.locator('input');
    const textArea = kuiklyPage.page.locator('textarea');
    await expect(inputs).toHaveCount(4);
    await expect(textArea).toHaveCount(1);
  });

  test('不同输入类型与回显应正确更新', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    const inputs = kuiklyPage.page.locator('input');
    const textArea = kuiklyPage.page.locator('textarea');

    await expect(inputs.nth(0)).toHaveAttribute('placeholder', '请输入文本');
    await expect(inputs.nth(1)).toHaveAttribute('type', 'password');
    await expect(inputs.nth(2)).toHaveAttribute('type', 'number');
    await expect(textArea).toHaveAttribute('placeholder', '请输入多行文本...');

    await inputs.nth(0).fill('hello');
    await inputs.nth(1).fill('abcd');
    await inputs.nth(2).fill('12345');
    await textArea.fill('第一行\n第二行');

    await expect(inputs.nth(0)).toHaveValue('hello');
    await expect(inputs.nth(1)).toHaveValue('abcd');
    await expect(inputs.nth(2)).toHaveValue('12345');
    await expect(textArea).toHaveValue('第一行\n第二行');

    await expect(kuiklyPage.page.locator('text=输入内容: hello')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=已输入 4 个字符')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=数字内容: 12345')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=多行内容: 第一行')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=第二行')).toBeVisible();
  });

  test('最大长度输入框应截断到 10 个字符', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    const limitedInput = kuiklyPage.page.locator('input').nth(3);
    await expect(limitedInput).toHaveAttribute('maxlength', '10');

    await limitedInput.click();
    await expect(limitedInput).toBeFocused();
    await limitedInput.fill('123456789012345');

    await expect(limitedInput).toHaveValue('1234567890');
    await expect(kuiklyPage.page.locator('text=10/10')).toBeVisible();
  });

  test('视觉回归：InputTestPage 截图对比', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('InputTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('input-test-initial.png', {
      maxDiffPixels: 300,
    });
  });
});

test.describe('InputViewDemoPage 事件测试', () => {
  test('autofocus、样式和 focus/blur 日志应正常', async ({ kuiklyPage }) => {
    const inputLogs: string[] = [];
    kuiklyPage.page.on('console', (message) => {
      const text = message.text();
      if (text.includes('InputViewDemoPage')) {
        inputLogs.push(text);
      }
    });

    await kuiklyPage.goto('InputViewDemoPage');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.locator('input');
    await expect(input).toHaveCount(1);
    await expect(input).toBeFocused();

    const style = await input.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element as HTMLInputElement);
      return {
        placeholder: element.getAttribute('placeholder'),
        enterKeyHint: element.getAttribute('enterkeyhint'),
        fontWeight: computedStyle.fontWeight,
        fontSize: computedStyle.fontSize,
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
      };
    });

    expect(style.placeholder).toBe('我是placeholder');
    expect(style.enterKeyHint).toBe('next');
    expect(style.fontWeight).toBe('700');
    expect(style.fontSize).toBe('30px');
    expect(style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(style.color).toBe('rgb(0, 0, 0)');

    await input.fill('abc');
    await kuiklyPage.page.mouse.click(20, 20);
    await expect(input).not.toBeFocused();

    await expect.poll(() => inputLogs.some((log) => log.includes('inputFocusInputParams'))).toBe(true);
    await expect.poll(() => inputLogs.some((log) => log.includes('textDidChangeInputParams(text=abc'))).toBe(true);
    await expect.poll(() => inputLogs.some((log) => log.includes('inputBlurInputParams(text=abc'))).toBe(true);
  });
});

test.describe('InputSpanPager 光标测试', () => {
  test('getCursorIndex 与 setCursorIndex 应驱动光标位置变化', async ({ kuiklyPage }) => {
    const cursorLogs: string[] = [];
    kuiklyPage.page.on('console', (message) => {
      const text = message.text();
      if (text.includes('[KLog][CR7]:indec:')) {
        cursorLogs.push(text);
      }
    });

    await kuiklyPage.goto('4444');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.locator('input');
    await expect(input).toHaveCount(1);
    await expect.poll(() => cursorLogs.some((log) => log.includes('indec: 0'))).toBe(true);

    await input.click();
    await input.pressSequentially('abcdef');
    await expect(input).toHaveValue('abcdef');

    await expect.poll(() => cursorLogs.some((log) => log.includes('indec: 6')), { timeout: 5000 }).toBe(true);
    await expect.poll(() => input.evaluate((element) => (element as HTMLInputElement).selectionStart), { timeout: 10000 }).toBe(3);
    await expect.poll(() => cursorLogs.some((log) => log.includes('indec: 3')), { timeout: 10000 }).toBe(true);
  });
});

test.describe('maxLength 页面输入限制测试', () => {
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

  test('字符限制 input 与 textarea 应按 maxlength 截断', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('maxLength');
    await kuiklyPage.waitForRenderComplete();

    const characterInput = kuiklyPage.page.locator('input').nth(2);
    const characterTextArea = kuiklyPage.page.locator('textarea').nth(2);

    await characterInput.fill('12345678901');
    await characterTextArea.fill('123456789012345678901');

    await expect(characterInput).toHaveValue('1234567890');
    await expect(characterTextArea).toHaveValue('12345678901234567890');
  });
});
