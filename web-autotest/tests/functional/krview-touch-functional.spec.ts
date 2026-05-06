import { test, expect } from '../../fixtures/test-base';

test.describe('KRViewTouchTestPage touch event functional', () => {
  test('clicking touch-area should increment touchDown and touchUp counters', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const touchArea = kuiklyPage.page.getByText('touch-area', { exact: true });
    await expect(touchArea).toBeVisible();

    await touchArea.click();
    await kuiklyPage.waitForRenderComplete();

    // touchDown and touchUp should each be at least 1
    await expect(kuiklyPage.page.getByText(/touch-down: [1-9]/, { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText(/touch-up: [1-9]/, { exact: false })).toBeVisible();
  });

  test('dragging touch-area should trigger touchDown and touchUp via mouse down/up', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const touchArea = kuiklyPage.page.getByText('touch-area', { exact: true });
    await expect(touchArea).toBeVisible();

    const box = await touchArea.boundingBox();
    expect(box).toBeTruthy();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // mousedown + small move within element + mouseup
    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    // Move a small amount within the element to trigger mousemove on the element
    await kuiklyPage.page.mouse.move(cx + 5, cy + 5, { steps: 3 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(200);

    // After drag, touchDown should have fired at least once
    await expect(kuiklyPage.page.getByText(/touch-down: [1-9]/, { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText(/touch-up: [1-9]/, { exact: false })).toBeVisible();
  });

  test('pan gesture drag should update panState', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const panArea = kuiklyPage.page.getByText('pan-idle', { exact: true });
    await expect(panArea).toBeVisible();

    const box = await panArea.boundingBox();
    expect(box).toBeTruthy();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(cx + 80, cy, { steps: 12 });
    await kuiklyPage.page.waitForTimeout(100);
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(200);

    // Pan state should have transitioned away from idle
    const panLog = kuiklyPage.page.getByText(/pan-(?:start|move|end)/, { exact: false });
    await expect(panLog).toBeVisible();
  });

  test('long press should update longPressCount', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    // Verify initial state
    await expect(kuiklyPage.page.getByText('lp-count: 0', { exact: true })).toBeVisible();

    // Get bounding box of the text element itself to position the mouse on it
    const lpText = kuiklyPage.page.getByText('lp-count: 0', { exact: true });
    const box = await lpText.boundingBox();
    expect(box).toBeTruthy();

    // The long press View is the direct parent of the lp-count text
    // Position mouse in the center of the text's region
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.waitForTimeout(900);
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(300);

    // Long press count should be > 0
    await expect(kuiklyPage.page.getByText(/lp-count: [1-9]/, { exact: false })).toBeVisible();
  });

  test('double-clicking dblclick area should increment counter', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const dblArea = kuiklyPage.page.getByText('dblclick-idle', { exact: true });
    await expect(dblArea).toBeVisible();

    await dblArea.dblclick();
    await kuiklyPage.page.waitForTimeout(400);

    await expect(kuiklyPage.page.getByText('dblclick-count: 1', { exact: true })).toBeVisible();
  });

  test('screenFrame event should increment frame counter, screenFramePause should stop it', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 500, smooth: false });

    await expect(kuiklyPage.page.getByText('5. Screen Frame', { exact: false })).toBeVisible();

    // Wait for frame count to advance (screenFrame fires repeatedly)
    await kuiklyPage.page.waitForTimeout(200);

    // frame-count should be > 0 and <= 5 (gets auto-paused at 5)
    const frameText = await kuiklyPage.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find(e => (e.textContent || '').startsWith('frame-count:'));
      return el?.textContent || '';
    });
    expect(frameText).toMatch(/^frame-count: [1-5]$/);
  });

  test('mouseLeave while dragging should exercise isMouseDown leave branch', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const touchArea = kuiklyPage.page.getByText('touch-area', { exact: true });
    await expect(touchArea).toBeVisible();

    const box = await touchArea.boundingBox();
    expect(box).toBeTruthy();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Mouse down inside element, then move far outside to trigger mouseleave while isMouseDown=true
    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.waitForTimeout(50);
    // Move far outside the element boundary (exercises mouseLeave with isMouseDown=true)
    await kuiklyPage.page.mouse.move(cx + 500, cy + 500, { steps: 5 });
    await kuiklyPage.page.waitForTimeout(100);
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(200);

    // touchDown should have fired from the initial mousedown
    await expect(kuiklyPage.page.getByText(/touch-down: [1-9]/, { exact: false })).toBeVisible();
  });

  test('windowMouseUp outside element should exercise global mouseup listener', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const touchArea = kuiklyPage.page.getByText('touch-area', { exact: true });
    await expect(touchArea).toBeVisible();

    const box = await touchArea.boundingBox();
    expect(box).toBeTruthy();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Mouse down inside element
    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.waitForTimeout(50);

    // Move outside the element (but still within the window/page)
    await kuiklyPage.page.mouse.move(10, 10, { steps: 3 });
    await kuiklyPage.page.waitForTimeout(50);

    // Release mouse outside the element — triggers windowMouseUpListener
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(200);

    // touchDown should have fired, and touchUp should also fire via window listener
    await expect(kuiklyPage.page.getByText(/touch-down: [1-9]/, { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText(/touch-up: [1-9]/, { exact: false })).toBeVisible();
  });

  test('mouse move without button pressed should not trigger touch events', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTouchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const touchArea = kuiklyPage.page.getByText('touch-area', { exact: true });
    await expect(touchArea).toBeVisible();

    const box = await touchArea.boundingBox();
    expect(box).toBeTruthy();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Just move over the element without pressing — exercises isMouseDown=false in mousemove
    await kuiklyPage.page.mouse.move(cx - 20, cy);
    await kuiklyPage.page.mouse.move(cx + 20, cy, { steps: 5 });
    await kuiklyPage.page.waitForTimeout(100);

    // touch-down should remain at 0
    await expect(kuiklyPage.page.getByText('touch-down: 0', { exact: true })).toBeVisible();
  });
});
