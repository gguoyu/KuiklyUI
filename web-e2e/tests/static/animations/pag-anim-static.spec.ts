import { test, expect } from '../../../fixtures/test-base';

test.describe('PAG 动画 static 验证', () => {
  test('应该成功加载 PAG 动画资源并展示初始状态', async ({ kuiklyPage }) => {
    const pagResponsePromise = kuiklyPage.page.waitForResponse((response) =>
      response.url().includes('/assets/PAGExamplePage/user_avatar.pag'),
    );

    await kuiklyPage.goto('PAGAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    const pagResponse = await pagResponsePromise;
    expect(pagResponse.status()).toBe(200);

    await expect(kuiklyPage.page.getByText('PAGAnimTestPage', { exact: true })).toBeVisible();
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

    await expect(kuiklyPage.page.getByText('PAG status: ended', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG progress mode: manual-20%', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('PAG asset: user_avatar.pag with text and image replacement', { exact: true })).toBeVisible();
  });
});
