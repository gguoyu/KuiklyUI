import { test, expect } from '../../../fixtures/test-base';

test.describe('SharedPreferences 模块功能验证', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SharedPreferencesTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('should render SharedPreferencesTestPage', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('SharedPreferences 模块测试')).toBeVisible();
    await expect(kuiklyPage.page.getByText('setString / getString', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('setInt / getInt', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('setFloat / getFloat', { exact: true })).toBeVisible();
  });

  test('setString and getString should persist and retrieve value', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('setString / getString', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('string-result: hello-kuikly', { exact: true })).toBeVisible();
  });

  test('setInt and getInt should persist and retrieve integer', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('setInt / getInt', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('int-result: 42', { exact: true })).toBeVisible();
  });

  test('setFloat and getFloat should persist and retrieve float', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('setFloat / getFloat', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    const floatText = await kuiklyPage.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find(e => (e.textContent || '').startsWith('float-result:'));
      return el?.textContent || '';
    });
    expect(floatText).toMatch(/^float-result: 3\.14/);
  });

  test('update should overwrite existing key with new value', async ({ kuiklyPage }) => {
    // First set the string
    await kuiklyPage.page.getByText('setString / getString', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    // Then overwrite it
    await kuiklyPage.page.getByText('update (overwrite string)', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('update-result: updated-value', { exact: true })).toBeVisible();
  });

  test('getMissing should return empty string for non-existent key', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('getMissing', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('missing-result: empty', { exact: true })).toBeVisible();
  });

  test('multiple operations in sequence should all produce correct results', async ({ kuiklyPage }) => {
    await kuiklyPage.page.getByText('setString / getString', { exact: true }).click();
    await kuiklyPage.page.getByText('setInt / getInt', { exact: true }).click();
    await kuiklyPage.page.getByText('getMissing', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('string-result: hello-kuikly', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('int-result: 42', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('missing-result: empty', { exact: true })).toBeVisible();
  });
});
