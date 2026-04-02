import type { Locator } from '@playwright/test';

import { test, expect } from '../../fixtures/test-base';

async function longPressTarget(target: Locator) {
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('Long press target is not visible');
  }

  const page = target.page();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(850);
  await page.mouse.up();
  await page.waitForTimeout(200);
}

test.describe('Button 事件测试', () => {
  test('click 事件应更新按钮文案', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ButtonEventTestPage');
    await kuiklyPage.waitForRenderComplete();

    const clickButton = kuiklyPage.page.getByText('click-button', { exact: true });
    await expect(clickButton).toBeVisible();

    await clickButton.click();
    await expect(kuiklyPage.page.getByText('click-once', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('click-once', { exact: true }).click();
    await expect(kuiklyPage.page.getByText('click-twice', { exact: true })).toBeVisible();
  });

  test('doubleClick 事件应更新按钮文案', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ButtonEventTestPage');
    await kuiklyPage.waitForRenderComplete();

    const doubleClickButton = kuiklyPage.page.getByText('double-button', { exact: true });
    await expect(doubleClickButton).toBeVisible();

    await doubleClickButton.dblclick();
    await expect(kuiklyPage.page.getByText('double-once', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('double-once', { exact: true }).dblclick();
    await expect(kuiklyPage.page.getByText('double-twice', { exact: true })).toBeVisible();
  });

  test('longPress 事件应更新按钮文案', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ButtonEventTestPage');
    await kuiklyPage.waitForRenderComplete();

    const longPressButton = kuiklyPage.page.getByText('long-button', { exact: true });
    await expect(longPressButton).toBeVisible();

    await longPressTarget(longPressButton);
    await expect(kuiklyPage.page.getByText('long-once', { exact: true })).toBeVisible();

    await longPressTarget(kuiklyPage.page.getByText('long-once', { exact: true }));
    await expect(kuiklyPage.page.getByText('long-twice', { exact: true })).toBeVisible();
  });
});
