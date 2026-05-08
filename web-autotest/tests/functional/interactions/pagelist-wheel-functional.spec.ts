import { test, expect, type Locator, type Page } from '../../../fixtures/test-base';

async function wheelPageList(page: Page, container: Locator, deltaX: number, deltaY: number, waitMs = 500): Promise<boolean> {
  const dispatchResult = await container.evaluate((element, payload) => {
    return element.dispatchEvent(new WheelEvent('wheel', {
      deltaX: payload.deltaX,
      deltaY: payload.deltaY,
      bubbles: true,
      cancelable: true,
    }));
  }, { deltaX, deltaY });

  await page.waitForTimeout(waitMs);
  return dispatchResult;
}

test.describe('PageListWheelTestPage functional', () => {
  test.beforeEach(async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();
  });

  test('horizontal wheel should switch the horizontal pagelist forward', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();

    await expect(kuiklyPage.page.getByText('PageList Wheel Test', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('index:0 wheel:0', { exact: false })).toBeVisible();

    await wheelPageList(kuiklyPage.page, pageList, 500, 0, 600);

    await expect(kuiklyPage.page.getByText('index:1 wheel:1', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 1', { exact: true })).toBeVisible();
  });

  test('repeated horizontal wheel should stop at the last page boundary', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();

    await wheelPageList(kuiklyPage.page, pageList, 500, 0, 600);
    await wheelPageList(kuiklyPage.page, pageList, 500, 0, 600);
    await expect(kuiklyPage.page.getByText('index:2 wheel:2', { exact: false })).toBeVisible();

    await wheelPageList(kuiklyPage.page, pageList, 500, 0, 400);

    await expect(kuiklyPage.page.getByText('index:2 wheel:2', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 2', { exact: true })).toBeVisible();
  });

  test('horizontal wheel should navigate backward and stop at the first page boundary', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();

    await wheelPageList(kuiklyPage.page, pageList, 500, 0, 600);
    await wheelPageList(kuiklyPage.page, pageList, 500, 0, 600);
    await expect(kuiklyPage.page.getByText('index:2 wheel:2', { exact: false })).toBeVisible();

    await wheelPageList(kuiklyPage.page, pageList, -500, 0, 600);
    await expect(kuiklyPage.page.getByText('index:1 wheel:3', { exact: false })).toBeVisible();

    await wheelPageList(kuiklyPage.page, pageList, -500, 0, 600);
    await expect(kuiklyPage.page.getByText('index:0 wheel:4', { exact: false })).toBeVisible();

    await wheelPageList(kuiklyPage.page, pageList, -500, 0, 400);
    await expect(kuiklyPage.page.getByText('index:0 wheel:4', { exact: false })).toBeVisible();
  });

  test('small horizontal wheel delta should not trigger a page switch', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();

    await wheelPageList(kuiklyPage.page, pageList, 10, 0, 400);

    await expect(kuiklyPage.page.getByText('index:0 wheel:0', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 0', { exact: true })).toBeVisible();
  });

  test('accumulated wheel deltas should switch pages only after crossing the threshold', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();

    await wheelPageList(kuiklyPage.page, pageList, 14, 0, 40);
    await wheelPageList(kuiklyPage.page, pageList, 14, 0, 40);

    await expect(kuiklyPage.page.getByText('index:0 wheel:0', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 0', { exact: true })).toBeVisible();

    await wheelPageList(kuiklyPage.page, pageList, 14, 0, 600);

    await expect(kuiklyPage.page.getByText('index:1 wheel:1', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 1', { exact: true })).toBeVisible();
  });

  test('mouse down and up without movement should keep the pagelist on the current page', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();
    const box = await pageList.boundingBox();
    expect(box).toBeTruthy();

    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;

    await kuiklyPage.page.mouse.move(x, y);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(400);

    await expect(kuiklyPage.page.getByText('index:0 wheel:0', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 0', { exact: true })).toBeVisible();
  });

  test('vertical wheel should not switch the horizontal pagelist', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();

    await wheelPageList(kuiklyPage.page, pageList, 0, 500, 400);

    await expect(kuiklyPage.page.getByText('index:0 wheel:0', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 0', { exact: true })).toBeVisible();
  });

  test('switching outer pages should hide and restore nested PageList visibility', async ({ kuiklyPage }) => {
    const outerPageList = kuiklyPage.component('KRListView').first();

    await wheelPageList(kuiklyPage.page, outerPageList, 500, 0, 600);
    await expect(kuiklyPage.page.getByText('index:1 wheel:1', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Nested Page 0', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Nested item A0', { exact: true })).toBeVisible();

    const nestedToggle = kuiklyPage.page.getByText('nested:0', { exact: true });
    await nestedToggle.evaluate((node) => (node.parentElement as HTMLElement | null)?.click());
    await kuiklyPage.page.waitForTimeout(450);

    await expect(kuiklyPage.page.getByText('nested:1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Nested Page 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Nested item B1', { exact: true })).toBeVisible();

    await wheelPageList(kuiklyPage.page, outerPageList, 500, 0, 650);
    await expect(kuiklyPage.page.getByText('index:2 wheel:2', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 2', { exact: true })).toBeVisible();

    await wheelPageList(kuiklyPage.page, outerPageList, -500, 0, 650);
    await expect(kuiklyPage.page.getByText('index:1 wheel:3', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('nested:1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Nested item B1', { exact: true })).toBeVisible();
  });

  test('switching nested pages should recursively hide and restore deep nested PageList visibility', async ({ kuiklyPage }) => {
    const outerPageList = kuiklyPage.component('KRListView').first();

    await wheelPageList(kuiklyPage.page, outerPageList, 500, 0, 600);
    await expect(kuiklyPage.page.getByText('Nested Page 0', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Deep Nested Page 0', { exact: true })).toBeVisible();

    const deepToggle = kuiklyPage.page.getByText('deep:0', { exact: true });
    await deepToggle.evaluate((node) => (node.parentElement as HTMLElement | null)?.click());
    await kuiklyPage.page.waitForTimeout(450);

    const deepNestedPageText = kuiklyPage.page.getByText('Deep Nested Page 1', { exact: true });
    const deepNestedPageList = deepNestedPageText.locator('xpath=ancestor::*[contains(@class,"page-list")][1]');
    await expect(kuiklyPage.page.getByText('deep:1', { exact: true })).toBeVisible();
    await expect(deepNestedPageText).toBeVisible();
    await expect.poll(async () => deepNestedPageList.evaluate((element) => (element as HTMLElement).style.visibility)).toBe('');

    const nestedToggle = kuiklyPage.page.getByText('nested:0', { exact: true });
    await nestedToggle.evaluate((node) => (node.parentElement as HTMLElement | null)?.click());
    await kuiklyPage.page.waitForTimeout(450);
    await expect(kuiklyPage.page.getByText('nested:1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Nested Page 1', { exact: true })).toBeVisible();
    await expect.poll(async () => deepNestedPageList.evaluate((element) => (element as HTMLElement).style.visibility)).toBe('hidden');

    const nestedToggleBack = kuiklyPage.page.getByText('nested:1', { exact: true });
    await nestedToggleBack.evaluate((node) => (node.parentElement as HTMLElement | null)?.click());
    await kuiklyPage.page.waitForTimeout(450);
    await expect(kuiklyPage.page.getByText('nested:0', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('deep:1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Deep Nested Page 1', { exact: true })).toBeVisible();
    await expect.poll(async () => deepNestedPageList.evaluate((element) => (element as HTMLElement).style.visibility)).toBe('');
  });

  test('mouse drag on pagelist should exercise drag callback null paths', async ({ kuiklyPage }) => {
    // PageListWheelTestPage does NOT register dragBegin/dragEnd/scroll callbacks,
    // so dragging exercises the callback?.invoke() null branch paths
    const pageList = kuiklyPage.component('KRListView').first();
    const box = await pageList.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      // Horizontal drag to simulate page switch attempt
      await kuiklyPage.page.mouse.move(cx, cy);
      await kuiklyPage.page.mouse.down();
      await kuiklyPage.page.mouse.move(cx - 150, cy, { steps: 8 });
      await kuiklyPage.page.mouse.up();
      await kuiklyPage.page.waitForTimeout(400);
    }
    // Page should still be functional
    await expect(kuiklyPage.page.getByText('PageList Wheel Test', { exact: false })).toBeVisible();
  });

  test('navigating away after a wheel gesture should clean up the reset timer and allow re-entry', async ({ kuiklyPage }) => {
    const pageList = kuiklyPage.component('KRListView').first();

    await wheelPageList(kuiklyPage.page, pageList, 14, 0, 20);
    await kuiklyPage.goto('SmokeTestPage');
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('Smoke', { exact: true })).toBeVisible();

    await kuiklyPage.goto('PageListWheelTestPage');
    await kuiklyPage.waitForRenderComplete();

    const reenteredPageList = kuiklyPage.component('KRListView').first();
    await wheelPageList(kuiklyPage.page, reenteredPageList, 500, 0, 600);

    await expect(kuiklyPage.page.getByText('index:1 wheel:1', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('Page 1', { exact: true })).toBeVisible();
  });
});
