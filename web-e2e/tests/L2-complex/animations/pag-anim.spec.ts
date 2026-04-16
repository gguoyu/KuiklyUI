import { test, expect } from '../../../fixtures/test-base';

test.describe('PAG animation tests', () => {
  test('loads pag asset and initializes canvas playback', async ({ kuiklyPage }) => {
    const pagResponsePromise = kuiklyPage.page.waitForResponse((response) =>
      response.url().includes('/assets/PAGExamplePage/user_avatar.pag'),
    );

    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pagResponse = await pagResponsePromise;
    expect(pagResponse.status()).toBe(200);

    await expect(kuiklyPage.page.getByText('PAGAnimTestPage')).toBeVisible();
    await expect.poll(() => kuiklyPage.page.evaluate(() => !!window.PAGInstance)).toBe(true);
    await expect.poll(() =>
      kuiklyPage.page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
          return 'missing';
        }
        return `${canvas.width}x${canvas.height}:${canvas.clientWidth}x${canvas.clientHeight}`;
      }),
    ).toBe('260x180:260x180');

    await expect(kuiklyPage.page.getByText('PAG status: ended')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: manual-20%')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG asset: user_avatar.pag with text and image replacement')).toBeVisible();
  });

  test('supports replaying and pausing after pag asset initialization', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('PAG status: ended')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: manual-20%')).toBeVisible();

    await kuiklyPage.page.getByText('Play PAG').click();
    await expect(kuiklyPage.page.getByText('PAG status: running')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: auto')).toBeVisible();

    await kuiklyPage.page.getByText('Pause at 20%').click();
    await expect(kuiklyPage.page.getByText('PAG status: paused')).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: manual-20%')).toBeVisible();
    await expect.poll(() =>
      kuiklyPage.page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return canvas ? `${canvas.width}x${canvas.height}` : 'missing';
      }),
    ).toBe('260x180');
  });
});
