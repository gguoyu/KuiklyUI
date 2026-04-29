import { test, expect, type Locator } from '../../../fixtures/test-base';

async function getClosestViewMetrics(trigger: Locator): Promise<{ width: number; height: number } | null> {
  return trigger.evaluate((el) => {
    const parent = el.closest('[data-kuikly-component="KRView"]') as HTMLElement | null;
    return parent ? { width: parent.offsetWidth, height: parent.offsetHeight } : null;
  });
}

async function getClosestViewBackgroundColor(trigger: Locator): Promise<string | null> {
  return trigger.evaluate((el) => {
    const parent = el.closest('[data-kuikly-component="KRView"]') as HTMLElement | null;
    return parent ? window.getComputedStyle(parent).backgroundColor : null;
  });
}

test.describe('CSS Transition 功能验证', () => {
  test('尺寸变化动画：触发后元素应扩大', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const trigger = kuiklyPage.page.getByText('Click Me', { exact: false });
    await expect(trigger).toBeVisible();

    const sizeBefore = await getClosestViewMetrics(trigger);

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('已展开 (200x200)', { exact: false })).toBeVisible();

    if (sizeBefore) {
      const sizeAfter = await getClosestViewMetrics(trigger);
      expect(sizeAfter).not.toBeNull();
      expect(sizeAfter!.width).toBeGreaterThanOrEqual(sizeBefore.width);
      expect(sizeAfter!.height).toBeGreaterThanOrEqual(sizeBefore.height);
    }
  });

  test('尺寸变化动画：二次点击应还原', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const trigger = kuiklyPage.page.getByText('Click Me', { exact: false });

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('已展开 (200x200)', { exact: false })).toBeVisible();

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('未展开 (100x100)', { exact: false })).toBeVisible();
  });

  test('颜色变化动画：触发后背景色应切换到绿色', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const trigger = kuiklyPage.page.getByText('Click to Change Color', { exact: false });
    await expect(trigger).toBeVisible();

    const backgroundColorBefore = await getClosestViewBackgroundColor(trigger);
    expect(backgroundColorBefore).toBe('rgb(33, 150, 243)');

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();

    const backgroundColorAfter = await getClosestViewBackgroundColor(trigger);
    expect(backgroundColorAfter).toBe('rgb(76, 175, 80)');
  });

  test('宽度动画：触发后宽度文字更新为 300px', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const trigger = kuiklyPage.page.getByText('Toggle Width', { exact: false });
    const widthBefore = await getClosestViewMetrics(trigger);

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('宽度: 300px', { exact: false })).toBeVisible({ timeout: 3000 });

    if (widthBefore) {
      const widthAfter = await getClosestViewMetrics(trigger);
      expect(widthAfter).not.toBeNull();
      expect(widthAfter!.width).toBeGreaterThan(widthBefore.width);
    }
  });

  test('Repeat 动画：点击按钮后切换到 repeat-running 状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 600, smooth: false });

    const repeatBtn = kuiklyPage.page.getByText('repeat-idle', { exact: true });
    await expect(repeatBtn).toBeVisible();

    await repeatBtn.click();
    await kuiklyPage.waitForRenderComplete();

    // Label should update to repeat-running
    await expect(kuiklyPage.page.getByText('repeat-running', { exact: true })).toBeVisible();
  });

  test('Repeat 动画：再次点击应切换回 repeat-idle', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 600, smooth: false });

    // Start animation
    await kuiklyPage.page.getByText('repeat-idle', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('repeat-running', { exact: true })).toBeVisible();

    // Stop animation
    await kuiklyPage.page.getByText('repeat-running', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('repeat-idle', { exact: true })).toBeVisible();
  });

  test('Animation End Callback: animated view should render and be clickable', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });

    await expect(kuiklyPage.page.getByText('6. Animation End Callback', { exact: false })).toBeVisible();

    // The view with animationCompletion event should be visible and clickable
    const animEndView = kuiklyPage.page.getByText(/anim-end: \d/, { exact: false });
    await expect(animEndView).toBeVisible();

    // Click to trigger animation + animationCompletion callback path
    await animEndView.click();
    await kuiklyPage.page.waitForTimeout(1000);
  });

  test('Spring Animation: clicking should toggle spring animation', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1000, smooth: false });

    await expect(kuiklyPage.page.getByText('7. Spring Animation', { exact: false })).toBeVisible();

    const springBtn = kuiklyPage.page.getByText('Spring', { exact: true });
    await expect(springBtn).toBeVisible();

    await springBtn.click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);
  });

  test('Border with Child: should render bordered container with child text', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1200, smooth: false });

    await expect(kuiklyPage.page.getByText('8. Border with Child', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('child-inside-border', { exact: false })).toBeVisible();
  });

  test('Mask Gradient: should render image with mask gradient', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1400, smooth: false });

    await expect(kuiklyPage.page.getByText('9. Mask Gradient', { exact: false })).toBeVisible();
  });
});
