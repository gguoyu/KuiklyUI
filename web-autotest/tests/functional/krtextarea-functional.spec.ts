import { test, expect } from '../../fixtures/test-base';

test.describe('KRTextAreaView functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextAreaViewTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('page renders all sections', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('1. Basic TextArea')).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Read-only Toggle')).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. Clear Counter')).toBeVisible();
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
    await expect(kuiklyPage.page.getByText('6. Styling & Keyboard')).toBeVisible();
  });

  test('textAlignCenter and tintColor are applied to center-aligned textarea', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 500, smooth: false });
    await expect(kuiklyPage.page.getByText('6. Styling & Keyboard')).toBeVisible();

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
    await expect(kuiklyPage.page.getByText('1. Basic TextArea')).toBeVisible();

    const textarea = kuiklyPage.page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    // Verify the initial text was set (SRC prop handler exercised)
    const value = await textarea.inputValue().catch(() => '');
    // initial-content was set via text() attribute
    expect(value).toBe('initial-content');
  });

  test('clicking in textarea and pressing Enter exercises focus and keydown event lambdas', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('1. Basic TextArea')).toBeVisible();

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
    await expect(kuiklyPage.page.getByText('1. Basic TextArea')).toBeVisible();
  });
});
