import { test, expect } from '../../../fixtures/test-base';

test.describe('TransformMask static 验证', () => {
  test('should load TransformMaskTestPage and render all sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('TransformMaskTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Verify all section titles are visible
    await expect(kuiklyPage.page.getByText('Transform - Rotation', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Transform - Scale', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Transform - Skew', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Transform - Anchor', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Mask Gradient on Image', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Text Stroke', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Semi-transparent Background', { exact: false })).toBeVisible();
  });
});
