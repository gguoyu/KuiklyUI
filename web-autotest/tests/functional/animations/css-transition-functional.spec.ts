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

    const trigger = kuiklyPage.page.getByText('Click Me');
    await expect(trigger).toBeVisible();

    const sizeBefore = await getClosestViewMetrics(trigger);

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('已展开 (200x200)')).toBeVisible();

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

    const trigger = kuiklyPage.page.getByText('Click Me');

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('已展开 (200x200)')).toBeVisible();

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('未展开 (100x100)')).toBeVisible();
  });

  test('颜色变化动画：触发后背景色应切换到绿色', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSTransitionTestPage');
    await kuiklyPage.waitForRenderComplete();

    const trigger = kuiklyPage.page.getByText('Click to Change Color');
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

    const trigger = kuiklyPage.page.getByText('Toggle Width');
    const widthBefore = await getClosestViewMetrics(trigger);

    await trigger.click();
    await kuiklyPage.waitForTransitionEnd(trigger.locator('..'));
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('宽度: 300px')).toBeVisible({ timeout: 3000 });

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
});
