import { test, expect } from '../../fixtures/test-base';

import type { Locator } from '@playwright/test';

async function getLeft(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

test.describe('事件捕获测试', () => {
  test('左侧边缘向右拖拽后页面内容应整体右移', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const title = kuiklyPage.page.getByText('capture-title', { exact: true });
    const initialLeft = await getLeft(title);

    await kuiklyPage.page.mouse.move(24, 120);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(220, 120, { steps: 16 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(600);

    const movedLeft = await getLeft(title);
    expect(movedLeft).toBeGreaterThan(initialLeft + 100);
    await expect(kuiklyPage.page.getByText('page-1', { exact: true })).toBeVisible();
  });

  test('reset 按钮应将已右移的页面恢复到初始位置', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const title = kuiklyPage.page.getByText('capture-title', { exact: true });
    const initialLeft = await getLeft(title);

    await kuiklyPage.page.mouse.move(24, 120);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(220, 120, { steps: 16 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(600);

    await kuiklyPage.page.getByText('reset', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(600);

    const resetLeft = await getLeft(title);
    expect(Math.abs(resetLeft - initialLeft)).toBeLessThan(5);
  });
});
