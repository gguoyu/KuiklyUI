import { test, expect } from '../../fixtures/test-base';

test.describe('CSSPropsTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('CSSPropsTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('page renders all CSS prop sections', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('1. Text Shadow', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. Stroke Width and Color', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. Touch Enable Toggle', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. Asymmetric Border Radius', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. Overflow Hidden vs Visible', { exact: false })).toBeVisible();
  });

  test('toggling touch-enabled state triggers touchEnable CSS prop handler', async ({ kuiklyPage }) => {
    // Initial state
    await expect(kuiklyPage.page.getByText('touch-enabled', { exact: true })).toBeVisible();

    // Click toggle — sets touchEnable(false) on the target view, exercising TOUCH_ENABLE handler
    await kuiklyPage.page.getByText('touch-enabled', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('touch-disabled', { exact: true })).toBeVisible();

    // Click toggle again — sets touchEnable(true)
    await kuiklyPage.page.getByText('touch-disabled', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('touch-enabled', { exact: true })).toBeVisible();
  });

  test('asymmetric border radius renders without error', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('asymmetric-radius', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('uniform-radius', { exact: false })).toBeVisible();
  });

  test('overflow variants render correctly', async ({ kuiklyPage }) => {
    await expect(kuiklyPage.page.getByText('overflow-hidden', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('overflow-visible', { exact: false })).toBeVisible();
  });

  test('z-index views render with zIndex prop applied', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 600, smooth: false });
    await expect(kuiklyPage.page.getByText('6. Z-Index', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('zindex-10', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('zindex-1', { exact: true })).toBeVisible();
  });

  test('accessibility label view renders with accessibility prop applied', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 800, smooth: false });
    await expect(kuiklyPage.page.getByText('7. Accessibility', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('accessibility-label-button', { exact: false })).toBeVisible();
  });

  test('visibility toggle should change visibility prop on the target view', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 900, smooth: false });
    await expect(kuiklyPage.page.getByText('8. Visibility Toggle', { exact: false })).toBeVisible();

    // Initial state: visibility-visible
    const toggle = kuiklyPage.page.getByText('visibility-visible', { exact: true });
    await expect(toggle).toBeVisible();

    // Toggle to hidden
    await toggle.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('visibility-hidden', { exact: true })).toBeVisible();

    // Toggle back to visible
    await kuiklyPage.page.getByText('visibility-hidden', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('visibility-visible', { exact: true })).toBeVisible();
  });

  test('double click should update double-click count', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1400, smooth: false });
    await expect(kuiklyPage.page.getByText('9. Double Click', { exact: false })).toBeVisible();

    const target = kuiklyPage.page.getByText('double-click-count: 0', { exact: false });
    await expect(target).toBeVisible();

    await target.dblclick();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('double-click-count: 1', { exact: false })).toBeVisible();
  });

  test('long press should update long-press count', async ({ kuiklyPage }) => {
    // [KNOWN: Long press via mouse.down/up in headless Chromium is unreliable
    // because the web longPress handler uses touch events (coarse-pointer only)
    // and has a 700ms timer that may not fire consistently under synthetic mouse.]
    test.skip(true, '[KNOWN: longPress mouse simulation unreliable in headless]');

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1500, smooth: false });
    await expect(kuiklyPage.page.getByText('10. Long Press', { exact: false })).toBeVisible();

    const target = kuiklyPage.page.getByText('long-press-count: 0', { exact: false });
    await expect(target).toBeVisible();

    const box = await target.boundingBox();
    expect(box).toBeTruthy();
    await kuiklyPage.page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.waitForTimeout(850);
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('long-press-count: 1', { exact: false })).toBeVisible();
  });

  test('click + doubleClick should exercise the hasBindDoubleClick timer branch', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1600, smooth: false });
    await expect(kuiklyPage.page.getByText('11. Click + DoubleClick', { exact: false })).toBeVisible();

    const target = kuiklyPage.page.getByText('click-with-double: 0', { exact: false });
    await expect(target).toBeVisible();

    // Single click — should fire after the 200ms timer (since doubleClick is also bound)
    await target.click();
    await kuiklyPage.page.waitForTimeout(300);
    await expect(kuiklyPage.page.getByText('click-with-double: 1', { exact: false })).toBeVisible();
  });
});
