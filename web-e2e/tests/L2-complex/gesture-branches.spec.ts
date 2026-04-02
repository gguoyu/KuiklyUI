import type { Locator } from '@playwright/test';

import { test, expect } from '../../fixtures/test-base';

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

test.describe('Gesture branch coverage', () => {
  test('quick repeated clicks should continue updating click count and log', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const target = kuiklyPage.page.getByText('快速点击此区域', { exact: true });

    await target.click();
    await target.click();
    await target.click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('点击计数: 3').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('操作日志: 单击 #3')).toBeVisible();
  });

  test('long press should toggle active state back off on the second trigger', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const target = kuiklyPage.page.getByText('长按此区域', { exact: true });
    await longPressTarget(target);

    await expect(kuiklyPage.page.getByText('长按状态: 已激活')).toBeVisible();
    await expect(kuiklyPage.page.getByText('操作日志: 长按激活')).toBeVisible();

    await longPressTarget(kuiklyPage.page.getByText('长按已激活！', { exact: true }));

    await expect(kuiklyPage.page.getByText('长按状态: 未激活')).toBeVisible();
    await expect(kuiklyPage.page.getByText('操作日志: 长按取消')).toBeVisible();
  });
});
