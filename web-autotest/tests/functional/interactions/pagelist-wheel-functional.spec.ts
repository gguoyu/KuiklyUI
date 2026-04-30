import { test, expect, type Locator, type Page } from '../../../fixtures/test-base';

async function wheelPageList(page: Page, container: Locator, deltaX: number, deltaY: number, waitMs = 500): Promise<void> {
  await container.evaluate((element, payload) => {
    element.dispatchEvent(new WheelEvent('wheel', {
      deltaX: payload.deltaX,
      deltaY: payload.deltaY,
      bubbles: true,
      cancelable: true,
    }));
  }, { deltaX, deltaY });

  await page.waitForTimeout(waitMs);
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
});
