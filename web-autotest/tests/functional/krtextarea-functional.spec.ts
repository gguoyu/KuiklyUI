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
});
