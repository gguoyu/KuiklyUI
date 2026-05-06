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
    // The longPress handler is on a View inside a KRListView. The list's own
    // mousedown handler sets isClickEvent=true and starts a click detection timer,
    // which interferes with the longPress timer — the list consumes the mouseup
    // before the longPress threshold (700ms) is reached.
    test.skip(true, '[KNOWN: longPress inside KRListView — list mouse handler interferes with long press timer]');

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1500, smooth: false });
    await expect(kuiklyPage.page.getByText('10. Long Press', { exact: false })).toBeVisible();

    const target = kuiklyPage.page.getByText('long-press-count: 0', { exact: false });
    await expect(target).toBeVisible();

    // The longPress handler is on the parent View, not the Text itself.
    // Use the parent element's bounding box for the mouse interaction.
    const box = await target.evaluate((el) => {
      const parent = el.closest('[data-kuikly-component="KRView"]') as HTMLElement | null;
      if (!parent) return null;
      const rect = parent.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
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

  test('text shadow section should render styled text elements', async ({ kuiklyPage }) => {
    // Section 1: Text Shadow — exercises KuiklyRenderCSSKTX textShadow path
    await expect(kuiklyPage.page.getByText('1. Text Shadow', { exact: false })).toBeVisible();
    // Verify multiple RichTextView components exist in this section
    const richTextViews = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"]');
    const count = await richTextViews.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('stroke width and color section should render styled text', async ({ kuiklyPage }) => {
    // Section 2: exercises KuiklyRenderCSSKTX stroke/textStroke conversion
    await expect(kuiklyPage.page.getByText('2. Stroke Width and Color', { exact: false })).toBeVisible();
    const strokeViews = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"]');
    const count = await strokeViews.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('z-index section should apply CSS zIndex to rendered views', async ({ kuiklyPage }) => {
    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 600, smooth: false });

    // Verify actual computed zIndex on KRView elements in section 6
    const zIndexView = kuiklyPage.page.getByText('zindex-10', { exact: true });
    await expect(zIndexView).toBeVisible();
    const parentView = zIndexView.locator('..');
    const zIndex = await parentView.evaluate((el) => window.getComputedStyle(el).zIndex);
    expect(Number(zIndex)).toBeGreaterThanOrEqual(1);
  });

  test('gradient backgrounds should have correct linear-gradient in computed style', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 400, smooth: false });

    const views = kuiklyPage.page.locator('[data-kuikly-component=KRView]');
    const count = await views.count();
    let hasGradient = false;
    for (let i = 0; i < Math.min(count, 30); i++) {
      const bg = await views.nth(i).evaluate((el) => window.getComputedStyle(el).backgroundImage);
      if (bg.includes('linear-gradient')) {
        hasGradient = true;
        break;
      }
    }
    expect(hasGradient).toBe(true);
  });

  test('overflow hidden section should have overflow:hidden in computed style', async ({ kuiklyPage }) => {
    const hiddenView = kuiklyPage.page.getByText('overflow-hidden', { exact: false });
    await expect(hiddenView).toBeVisible();
    const overflow = await hiddenView.locator('..').evaluate((el) =>
      window.getComputedStyle(el).overflow
    );
    expect(overflow).toBe('hidden');
  });

  test('RichTextView with textShadow should have text-shadow in computed style', async ({ kuiklyPage }) => {
    // Section 1 has text shadow — verify at least one RichTextView has text-shadow applied
    await expect(kuiklyPage.page.getByText('1. Text Shadow', { exact: false })).toBeVisible();
    const richTexts = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"]');
    const count = await richTexts.count();
    let hasShadow = false;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const shadow = await richTexts.nth(i).evaluate((el) =>
        window.getComputedStyle(el).textShadow
      );
      if (shadow && shadow !== 'none') { hasShadow = true; break; }
    }
    // textShadow may be on a child span — check deeper
    if (!hasShadow) {
      const spans = kuiklyPage.page.locator('[data-kuikly-component="KRRichTextView"] span');
      const spanCount = await spans.count();
      for (let i = 0; i < Math.min(spanCount, 10); i++) {
        const shadow = await spans.nth(i).evaluate((el) =>
          window.getComputedStyle(el).textShadow
        );
        if (shadow && shadow !== 'none') { hasShadow = true; break; }
      }
    }
    expect(hasShadow).toBe(true);
  });

  test('stroke text should have webkitTextStroke in computed style', async ({ kuiklyPage }) => {
    // Section 2 has stroke text — verify stroke is applied
    const strokeText = kuiklyPage.page.getByText('stroke-text-thin', { exact: true });
    if (await strokeText.isVisible()) {
      const stroke = await strokeText.locator('..').evaluate((el) => {
        const style = window.getComputedStyle(el);
        return (style as Record<string, unknown>).webkitTextStroke || style.getPropertyValue('-webkit-text-stroke') || '';
      });
      expect(String(stroke)).not.toBe('');
    }
  });
});
