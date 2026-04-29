import { test, expect, type Locator, type Page } from '../../fixtures/test-base';

async function longPressTarget(target: Locator, holdMs: number = 850) {
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('Long press target is not visible');
  }

  const page = target.page();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(holdMs);
  await page.mouse.up();
  await page.waitForTimeout(250);
}

test.describe('Gesture functional', () => {
  test('horizontal scroll area should remain interactive after swipe', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollContainer = kuiklyPage.component('KRScrollContentView').first();
    await kuiklyPage.swipeInContainer(scrollContainer, {
      direction: 'left',
      distance: 300,
    });
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Page 1 of 5', { exact: false })).toBeVisible();
  });

  test('tap counter should increment on each click', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('tap-count: 0', { exact: false }).first()).toBeVisible();

    await kuiklyPage.page.getByText('tap here', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('tap-count: 1', { exact: false }).first()).toBeVisible();

    await kuiklyPage.page.getByText('tap here', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('tap-count: 2', { exact: false }).first()).toBeVisible();
  });

  test('tapping different zones should update current-zone label', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('current-zone: none', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('zone-a', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('current-zone: a', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('zone-b', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('current-zone: b', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('zone-c', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('current-zone: c', { exact: false })).toBeVisible();
  });

  test('tapping a zone should update gesture-log', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('gesture-log: idle', { exact: false })).toBeVisible();

    await kuiklyPage.page.getByText('zone-b', { exact: false }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('gesture-log: tapped zone-b', { exact: false })).toBeVisible();
  });

  test('rapid successive taps should keep incrementing count and log', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const target = kuiklyPage.page.getByText('tap here', { exact: true });

    await target.click();
    await target.click();
    await target.click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('tap-count: 3', { exact: false }).first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('gesture-log: tap #3', { exact: false })).toBeVisible();
  });

  test('second long press should deactivate the long press state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const target = kuiklyPage.page.getByText('long-press-area', { exact: true });
    await longPressTarget(target);

    await expect(kuiklyPage.page.getByText('long-press-status: active', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('gesture-log: long-press-activated', { exact: false })).toBeVisible();

    await longPressTarget(kuiklyPage.page.getByText('long-pressed', { exact: true }));

    await expect(kuiklyPage.page.getByText('long-press-status: inactive', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('gesture-log: long-press-cancelled', { exact: false })).toBeVisible();
  });

  test('double clicking the double-click area should increment counter', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const target = kuiklyPage.page.getByText('double-click-area', { exact: true });
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeVisible();
    await target.dblclick();
    await kuiklyPage.page.waitForTimeout(400);

    await expect(kuiklyPage.page.getByText('double-clicked: 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('gesture-log: double-click #1', { exact: false })).toBeVisible();
  });

  test('pan gesture on the pan area should transition through pan states', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const panArea = kuiklyPage.page.getByText('pan-idle', { exact: true });
    await panArea.scrollIntoViewIfNeeded();
    await expect(panArea).toBeVisible();

    const box = await panArea.boundingBox();
    if (!box) throw new Error('Pan area not visible');

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await kuiklyPage.page.mouse.move(cx, cy);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(cx + 60, cy, { steps: 10 });
    await kuiklyPage.page.waitForTimeout(80);
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(200);

    // After pan completes, gesture-log should reflect a pan event
    const log = kuiklyPage.page.getByText(/gesture-log: pan:/, { exact: false });
    await expect(log).toBeVisible();
  });
});
