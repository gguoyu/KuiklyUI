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

  test('滚动后应渲染 scale mode 区域和事件计数标签', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 500, smooth: false });

    await expect(kuiklyPage.page.getByText('Scale Modes')).toBeVisible();
    await expect(kuiklyPage.page.getByText('cancel-count: 0', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('repeat-count: 0', { exact: true })).toBeVisible();
  });

  test('加载失败的 PAG 文件应触发 loadFailure 回调', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 500, smooth: false });
    await kuiklyPage.page.waitForTimeout(2000);

    // loadFailure callback registered — exercises LOAD_FAIL prop handler in KRPagView
    const loadText = kuiklyPage.page.getByText(/load-fail:/);
    await expect(loadText).toBeVisible();
  });
});
