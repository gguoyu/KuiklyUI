import { test, expect, type Locator } from '../../fixtures/test-base';

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

    await expect(kuiklyPage.page.getByText('Page 1 of 5')).toBeVisible();
  });

  test('tap counter should increment on each click', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('tap-count: 0').first()).toBeVisible();

    await kuiklyPage.page.getByText('tap here').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('tap-count: 1').first()).toBeVisible();

    await kuiklyPage.page.getByText('tap here').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('tap-count: 2').first()).toBeVisible();
  });

  test('tapping different zones should update current-zone label', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('current-zone: none')).toBeVisible();

    await kuiklyPage.page.getByText('zone-a').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('current-zone: a')).toBeVisible();

    await kuiklyPage.page.getByText('zone-b').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('current-zone: b')).toBeVisible();

    await kuiklyPage.page.getByText('zone-c').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('current-zone: c')).toBeVisible();
  });

  test('tapping a zone should update gesture-log', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('gesture-log: idle')).toBeVisible();

    await kuiklyPage.page.getByText('zone-b').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('gesture-log: tapped zone-b')).toBeVisible();
  });

  test('rapid successive taps should keep incrementing count and log', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const target = kuiklyPage.page.getByText('tap here', { exact: true });

    await target.click();
    await target.click();
    await target.click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('tap-count: 3').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('gesture-log: tap #3')).toBeVisible();
  });

  test('second long press should deactivate the long press state', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const target = kuiklyPage.page.getByText('long-press-area', { exact: true });
    await longPressTarget(target);

    await expect(kuiklyPage.page.getByText('long-press-status: active')).toBeVisible();
    await expect(kuiklyPage.page.getByText('gesture-log: long-press-activated')).toBeVisible();

    await longPressTarget(kuiklyPage.page.getByText('long-pressed', { exact: true }));

    await expect(kuiklyPage.page.getByText('long-press-status: inactive')).toBeVisible();
    await expect(kuiklyPage.page.getByText('gesture-log: long-press-cancelled')).toBeVisible();
  });
});
