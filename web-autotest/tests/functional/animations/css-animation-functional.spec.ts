import { test, expect } from '../../../fixtures/test-base';

test.describe('CSSAnimationTestPage functional', () => {
  test('should trigger animation completion callback', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSAnimationTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Click frame animation toggle
    const frameBtn = kuiklyPage.page.getByText('Frame', { exact: false }).first();
    await frameBtn.click();
    await kuiklyPage.page.waitForTimeout(800);

    // Completion detail should update after animation finishes
    const completionText = kuiklyPage.page.getByText(/completion: completed/, { exact: false });
    await expect(completionText).toBeVisible();
  });

  test('should cancel animation', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSAnimationTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Start animation
    const toggleBtn = kuiklyPage.page.getByText('Toggle', { exact: false }).first();
    await toggleBtn.click();
    await kuiklyPage.page.waitForTimeout(200);

    // Cancel immediately
    const cancelBtn = kuiklyPage.page.getByText('Cancel', { exact: false }).first();
    await cancelBtn.click();
    await kuiklyPage.page.waitForTimeout(300);

    // Page should still be functional
    await expect(toggleBtn).toBeVisible();
  });
});
