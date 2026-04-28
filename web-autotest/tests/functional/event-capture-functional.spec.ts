import type { Locator } from '@playwright/test';

import { test, expect } from '../../fixtures/test-base';

async function getLeft(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

test.describe('事件捕获 functional 验证', () => {
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

  test('从左侧边缘外开始拖拽时页面不应发生位移', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const title = kuiklyPage.page.getByText('capture-title', { exact: true });
    const initialLeft = await getLeft(title);

    await kuiklyPage.page.mouse.move(160, 120);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(320, 120, { steps: 12 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(600);

    const finalLeft = await getLeft(title);
    expect(Math.abs(finalLeft - initialLeft)).toBeLessThan(5);
  });

  test('中等距离拖拽时页面应停在部分位移状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const title = kuiklyPage.page.getByText('capture-title', { exact: true });
    const initialLeft = await getLeft(title);

    await kuiklyPage.page.mouse.move(24, 120);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.mouse.move(120, 120, { steps: 10 });
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.page.waitForTimeout(600);

    const finalLeft = await getLeft(title);
    expect(finalLeft - initialLeft).toBeGreaterThan(20);
    expect(finalLeft - initialLeft).toBeLessThan(120);
  });

  test('long press 应更新 long-press 状态文本', async ({ kuiklyPage }) => {
    // [KNOWN: Long press via mouse.down/up in headless Chromium is unreliable
    // because the web longPress handler uses touch events (coarse-pointer only)
    // and has a 700ms timer that may not fire consistently under synthetic mouse.]
    test.skip(true, '[KNOWN: longPress mouse simulation unreliable in headless]');

    await kuiklyPage.goto('EventCaptureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const longPressTarget = kuiklyPage.page.getByText('long-press: none', { exact: true });
    await expect(longPressTarget).toBeVisible();

    const box = await longPressTarget.boundingBox();
    expect(box).toBeTruthy();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;

    await kuiklyPage.page.mouse.move(x, y);
    await kuiklyPage.page.mouse.down();
    await kuiklyPage.page.waitForTimeout(850);
    await kuiklyPage.page.mouse.up();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('long-press: end', { exact: true })).toBeVisible();
  });
});
