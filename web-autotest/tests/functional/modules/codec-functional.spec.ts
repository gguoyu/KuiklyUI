import { test, expect } from '../../../fixtures/test-base';

test.describe('KRCodecModule functional', () => {
  test('should load CodecModuleTestPage and display all codec results', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CodecModuleTestPage');
    await kuiklyPage.waitForRenderComplete();

    // urlEncode 'hello kuikly' => 'hello%20kuikly'
    await expect(kuiklyPage.page.getByText('urlEncode:hello%20kuikly', { exact: false })).toBeVisible();
    // urlDecode roundtrip => 'hello kuikly'
    await expect(kuiklyPage.page.getByText('urlDecode:hello kuikly', { exact: false })).toBeVisible();
    // base64Encode — non-empty result
    await expect(kuiklyPage.page.getByText(/base64Encode:.+/, { exact: false })).toBeVisible();
    // base64Decode roundtrip
    await expect(kuiklyPage.page.getByText('base64Decode:hello kuikly', { exact: false })).toBeVisible();
    // md5(16) — should be hex chars
    await expect(kuiklyPage.page.getByText(/md5\(16\):[a-f0-9]+/, { exact: false })).toBeVisible();
    // md5(32) — should be 32 hex chars
    await expect(kuiklyPage.page.getByText(/md5\(32\):[a-f0-9]{32}/, { exact: false })).toBeVisible();
    // sha256 — should be 64 hex chars
    await expect(kuiklyPage.page.getByText(/sha256:[a-f0-9]{64}/, { exact: false })).toBeVisible();
  });
});
