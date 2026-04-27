import { test, expect } from '../../../fixtures/test-base';

const PLAY_TRANSLATE = '播放平移';
const RESTORE_POSITION = '还原位置';
const SPRING_ACTION = '弹性运动';
const COLOR_ACTION = '变换颜色';
const RESTORE_COLOR = '还原颜色';
const COMBO_ACTION = '平移+旋转';
const RESTORE_ACTION = '还原';

async function waitForText(page, text, timeout = 5000) {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('属性动画 functional 验证', () => {
  test('平移与弹性动画应切换到还原状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(PLAY_TRANSLATE, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_POSITION);
    await kuiklyPage.page.getByText(RESTORE_POSITION, { exact: true }).first().click();
    await waitForText(kuiklyPage.page, PLAY_TRANSLATE);

    await kuiklyPage.page.getByText(SPRING_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_POSITION);
  });

  test('颜色与组合动画应切换到对应完成态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(COLOR_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_COLOR);

    await kuiklyPage.page.getByText(COMBO_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_ACTION);
  });

  test('timing function 按钮渲染且可点击 — 覆盖 easeIn/easeOut/easeInOut 分支', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('PropertyAnimTestPage');
    await kuiklyPage.waitForRenderComplete();

    const list = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(list, { deltaY: 600, smooth: false });

    await expect(kuiklyPage.page.getByText('5. Timing Functions')).toBeVisible();

    await kuiklyPage.page.getByText('ease-in-trigger', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(600);
    await kuiklyPage.page.getByText('ease-out-trigger', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(600);
    await kuiklyPage.page.getByText('ease-in-out-delay-trigger', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(700);

    await expect(kuiklyPage.page.getByText('5. Timing Functions')).toBeVisible();
  });
});
