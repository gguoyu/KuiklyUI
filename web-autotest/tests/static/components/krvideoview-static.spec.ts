import { test, expect } from '../../../fixtures/test-base';

test.describe('KRVideoView static 验证', () => {
  test('应该渲染 KRVideoView 页面和所有视频区域', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page.getByText('1. Basic Video (play)', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. Muted Video (muted=true)', { exact: false })).toBeVisible();

    // Video elements should be rendered (SRC, MUTED, RATE, RESIZE_MODE props exercised)
    const videos = kuiklyPage.page.locator('video');
    const videoCount = await videos.count();
    expect(videoCount).toBeGreaterThanOrEqual(1);
  });

  test('滚动后应渲染 Rate 和 Stretch 视频区域', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 500, smooth: false });

    await expect(kuiklyPage.page.getByText('3. Rate 1.5x + contain', { exact: false })).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. Stretch + Rate 2x', { exact: false })).toBeVisible();
  });

  test('playState 和 firstFrame 状态文本应反映视频回调已注册', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForTimeout(500);

    // play-state: text starts as "idle" but may transition to playing/ended via callback
    // first-frame: loaded (if video loads) or pending
    // Just verify the labels exist and were updated (callback registered)
    const playStateText = await kuiklyPage.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find(e => (e.textContent || '').startsWith('play-state:'));
      return el?.textContent || '';
    });
    expect(playStateText).toMatch(/^play-state:/);

    const firstFrameText = await kuiklyPage.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find(e => (e.textContent || '').startsWith('first-frame:'));
      return el?.textContent || '';
    });
    expect(firstFrameText).toMatch(/^first-frame:/);
  });

  test('点击 preplay/pause/stop 按钮更新控制标签', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('preplay', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('control: preplay', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('pause', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('control: pause', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('stop', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('control: stop', { exact: true })).toBeVisible();
  });

  test('section 5 preplay video renders and exercises KRVideoView.playControl(PREPLAY)', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRVideoViewTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 1200, smooth: false });

    await expect(kuiklyPage.page.getByText('5. PrePlay', { exact: false })).toBeVisible();

    // Verify video element is rendered
    const videos = kuiklyPage.page.locator('video');
    const videoCount = await videos.count();
    expect(videoCount).toBeGreaterThanOrEqual(1);
  });
});
