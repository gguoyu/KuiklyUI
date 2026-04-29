import { test, expect } from '../../../fixtures/test-base';

test.describe('RenderKTXTypesTestPage static', () => {
  test('should render all buttons', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RenderKTXTypesTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('RenderKTX Types', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('jsonTypes', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('colorFormats', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('codecOps', { exact: false })).toBeVisible();
  });

  test('should execute codec operations', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('RenderKTXTypesTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('jsonTypes', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/json:/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('colorFormats', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/colors:/, { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('codecOps', { exact: false }).click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText(/codec:/, { exact: false })).toBeVisible();
  });
});
