import { test, expect } from '../../../fixtures/test-base';

test.describe('CSSAnimationTestPage static', () => {
  test('should render all sections', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSAnimationTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('CSS Animation Advanced', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('1. Animation Cancel', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. Two-Step Commit', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Frame Animation (w+h)', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. Rapid Toggle', { exact: false })).toBeVisible();
  });

  test('should toggle animation states', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSAnimationTestPage');
    await kuiklyPage.waitForRenderComplete();

    const toggleBtn = kuiklyPage.page.getByText('Toggle', { exact: false }).first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await kuiklyPage.page.waitForTimeout(300);

    const cancelBtn = kuiklyPage.page.getByText('Cancel', { exact: false }).first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    await kuiklyPage.page.waitForTimeout(300);

    // Frame animation section
    const frameBtn = kuiklyPage.page.getByText('Frame', { exact: false }).first();
    await expect(frameBtn).toBeVisible();
    await frameBtn.click();
    await kuiklyPage.page.waitForTimeout(600);

    // Verify completion detail updated
    await expect(kuiklyPage.page.getByText(/completion:/, { exact: false })).toBeVisible();
  });
});
