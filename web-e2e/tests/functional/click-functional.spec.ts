import { test, expect } from '../../fixtures/test-base';

async function clickSwitchTrack(page: import('@playwright/test').Page): Promise<void> {
  const toggles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-kuikly-component="KRView"]'))
      .map((view) => {
        const box = (view as HTMLElement).getBoundingClientRect();
        return {
          cx: Math.round(box.x + box.width / 2),
          cy: Math.round(box.y + box.height / 2),
          width: box.width,
          height: box.height,
          y: box.y,
        };
      })
      .filter((box) => Math.abs(box.width - 52) < 5 && Math.abs(box.height - 28) < 5 && box.y > 0);
  });

  if (toggles.length === 0) {
    throw new Error('Notification switch track not found');
  }

  await page.mouse.click(toggles[0].cx, toggles[0].cy);
}

test.describe('点击交互功能验证', () => {
  test('应该成功加载 ClickTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.locator('text=1. 按钮点击')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=2. 计数器')).toBeVisible();
  });

  test('按钮点击应切换状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('点击我')).toBeVisible();
    await expect(kuiklyPage.page.getByText('状态: 未激活')).toBeVisible();

    await kuiklyPage.page.getByText('点击我').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('已点击')).toBeVisible();
    await expect(kuiklyPage.page.getByText('状态: 已激活')).toBeVisible();

    await kuiklyPage.page.getByText('已点击').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('点击我')).toBeVisible();
    await expect(kuiklyPage.page.getByText('状态: 未激活')).toBeVisible();
  });

  test('计数器应正确增减', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('0', { exact: true })).toBeVisible();

    const plusButton = kuiklyPage.page.getByText('+');
    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('1', { exact: true })).toBeVisible();

    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('2', { exact: true }).first()).toBeVisible();

    await plusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('3', { exact: true }).first()).toBeVisible();

    const minusButton = kuiklyPage.page.getByText('-');
    await minusButton.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('2', { exact: true }).first()).toBeVisible();
  });

  test('Tab 切换应更新选中状态和内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('当前显示: 全部内容')).toBeVisible();

    await kuiklyPage.page.getByText('推荐').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前显示: 推荐内容')).toBeVisible();

    await kuiklyPage.page.getByText('热门').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前显示: 热门内容')).toBeVisible();

    await kuiklyPage.page.getByText('全部').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前显示: 全部内容')).toBeVisible();
  });

  test('开关切换应正确切换 on/off 状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ClickTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('通知已关闭')).toBeVisible();

    await clickSwitchTrack(kuiklyPage.page);
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('通知已开启')).toBeVisible();

    await clickSwitchTrack(kuiklyPage.page);
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('通知已关闭')).toBeVisible();
  });
});
