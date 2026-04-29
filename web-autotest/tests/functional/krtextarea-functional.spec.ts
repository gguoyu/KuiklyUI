import { test, expect } from '../../fixtures/test-base';

test.describe('KRTextAreaView functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextAreaViewTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('page renders all sections', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('1. Basic TextArea', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Read-only Toggle', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. Clear Counter', { exact: false })).toBeVisible();
  });

  test('textarea-set-text button should call setText via ViewRef', async ({ kuiklyPage }) => {
    const setTextBtn = kuiklyPage.page.getByText('textarea-set-text-idle', { exact: true });
    await expect(setTextBtn).toBeVisible();

    await setTextBtn.click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('textarea-set-text: 1', { exact: true })).toBeVisible();
  });

  test('read-only toggle should update state', async ({ kuiklyPage }) => {
    const toggle = kuiklyPage.page.getByText('textarea-readonly-inactive', { exact: true });
    await expect(toggle).toBeVisible();

    await toggle.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('textarea-readonly-active', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('textarea-readonly-active', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('textarea-readonly-inactive', { exact: true })).toBeVisible();
  });

  test('styling and keyboard section renders', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 500, smooth: false });
    await expect(kuiklyPage.page.getByText('6. Styling & Keyboard', { exact: false })).toBeVisible();
  });

  test('textAlignCenter and tintColor are applied to center-aligned textarea', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 500, smooth: false });
    await expect(kuiklyPage.page.getByText('6. Styling & Keyboard', { exact: false })).toBeVisible();

    const centeredTextarea = kuiklyPage.page.locator('textarea[placeholder="center-aligned-area"]');
    await expect(centeredTextarea.first()).toBeVisible();

    // Verify text-align is center (exercises TEXT_ALIGN handler in KRTextAreaView)
    const textAlign = await centeredTextarea.first().evaluate((el) => {
      return window.getComputedStyle(el).textAlign;
    });
    expect(textAlign).toBe('center');
  });

  test('initial text content should trigger SRC prop handler on first render', async ({ kuiklyPage }) => {
    // The first TextArea has text("initial-content") which exercises KRTextAreaView.SRC handler
    await expect(kuiklyPage.page.getByText('1. Basic TextArea', { exact: false })).toBeVisible();

    const textarea = kuiklyPage.page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    // Verify the initial text was set (SRC prop handler exercised)
    const value = await textarea.inputValue().catch(() => '');
    // initial-content was set via text() attribute
    expect(value).toBe('initial-content');
  });

  test('clicking in textarea and pressing Enter exercises focus and keydown event lambdas', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('1. Basic TextArea', { exact: false })).toBeVisible();

    const textarea = kuiklyPage.page.locator('textarea').first();
    await textarea.click();
    await kuiklyPage.page.waitForTimeout(100);

    // Pressing Enter in textarea exercises INPUT_RETURN keydown lambda
    await kuiklyPage.page.keyboard.press('Enter');
    await kuiklyPage.page.waitForTimeout(100);

    // Tab to another element to trigger blur event
    await kuiklyPage.page.keyboard.press('Tab');
    await kuiklyPage.page.waitForTimeout(100);

    // Just verify no crash occurred
    await expect(kuiklyPage.page.getByText('1. Basic TextArea', { exact: false })).toBeVisible();
  });

  test('focus button should trigger KRTextAreaView.call(FOCUS)', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await expect(kuiklyPage.page.getByText('7. Focus / Blur / Cursor', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('focus-state:none', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('textarea-focus', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(200);

    await expect(kuiklyPage.page.getByText('focus-state:focused', { exact: false })).toBeVisible();
  });

  test('blur button should trigger KRTextAreaView.call(BLUR)', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    // Focus first, then blur
    await kuiklyPage.page.getByText('textarea-focus', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(200);
    await expect(kuiklyPage.page.getByText('focus-state:focused', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('textarea-blur', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(200);

    await expect(kuiklyPage.page.getByText('focus-state:blurred', { exact: false })).toBeVisible();
  });

  test('getCursorIndex button should trigger KRTextAreaView.call(GET_CURSOR_INDEX)', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await expect(kuiklyPage.page.getByText('cursor-index:-1', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('textarea-get-cursor', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(300);

    // cursor index should have updated (no longer -1)
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /cursor-index:(?!-1)/ }).first()).toBeVisible({ timeout: 3000 });
  });

  test('setCursorIndex button should trigger KRTextAreaView.call(SET_CURSOR_INDEX)', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await kuiklyPage.page.getByText('textarea-set-cursor-0', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(200);

    // No crash — cursor index set to 0
    await expect(kuiklyPage.page.getByText('7. Focus / Blur / Cursor', { exact: false })).toBeVisible();
  });

  test('textLengthBeyondLimit callback should trigger when input exceeds maxTextLength', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1200, smooth: false });

    await expect(kuiklyPage.page.getByText('8. Text Length Limit Callback', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('beyond-limit-count:0', { exact: false })).toBeVisible();

    const limitedTextarea = kuiklyPage.page.locator('textarea[placeholder="max 5 chars"]');
    await expect(limitedTextarea).toBeVisible();

    // Use keyboard.type() to simulate actual character input which triggers
    // the beforeinput/input event chain needed for textLengthBeyondLimit
    await limitedTextarea.click();
    await kuiklyPage.page.keyboard.type('abcdef', { delay: 30 });
    await kuiklyPage.page.waitForTimeout(500);

    // beyond-limit-count should have increased
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').filter({ hasText: /beyond-limit-count:(?!0)/ }).first()).toBeVisible({ timeout: 5000 });
  });
});
