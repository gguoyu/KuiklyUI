import { test, expect } from '../../../fixtures/test-base';

test.describe('PAG 动画 functional 验证', () => {
  test('支持重播并暂停到 20% 进度', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('PAG status: ended', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: manual-20%', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('Play PAG', { exact: true }).click();
    await expect(kuiklyPage.page.getByText('PAG status: running', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: auto', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('Pause at 20%', { exact: true }).click();
    await expect(kuiklyPage.page.getByText('PAG status: paused', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: manual-20%', { exact: true })).toBeVisible();
    await expect.poll(() =>
      kuiklyPage.page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return canvas ? `${canvas.width}x${canvas.height}` : 'missing';
      }),
    ).toBe('260x180');
  });
});
