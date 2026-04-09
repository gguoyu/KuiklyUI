import { test, expect } from '../../../fixtures/test-base';

test.describe('PAG animation tests', () => {
  test('renders pag page with stable labels and controls', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('PAGAnimTestPage')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG status: running')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: auto')).toBeVisible();
    await expect(kuiklyPage.page.getByText('Play PAG')).toBeVisible();
    await expect(kuiklyPage.page.getByText('Pause at 20%')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG asset: user_avatar.pag with text and image replacement')).toBeVisible();
  });

  test('supports pausing at manual 20 percent and resuming playback', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('Pause at 20%').click();
    await expect(kuiklyPage.page.getByText('PAG status: paused')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: manual-20%')).toBeVisible();

    await kuiklyPage.page.getByText('Play PAG').click();
    await expect(kuiklyPage.page.getByText('PAG status: running')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: auto')).toBeVisible();
  });
});
