import { test, expect, type Locator } from '../../fixtures/test-base';

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

test.describe('Gesture functional 验证', () => {
  test('水平翻页区域在滑动后仍应保持可交互', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    const scrollContainer = kuiklyPage.component('KRScrollContentView').first();
    await kuiklyPage.swipeInContainer(scrollContainer, {
      direction: 'left',
      distance: 300,
    });
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('Page 1 of 5')).toBeVisible();
  });

  test('点击区域后计数应正确递增', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('点击计数: 0').first()).toBeVisible();

    await kuiklyPage.page.getByText('快速点击此区域').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('点击计数: 1').first()).toBeVisible();

    await kuiklyPage.page.getByText('快速点击此区域').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('点击计数: 2').first()).toBeVisible();
  });

  test('点击不同区域后应更新当前区域标签', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('当前区域: 未点击')).toBeVisible();

    await kuiklyPage.page.getByText('区域 A').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前区域: A')).toBeVisible();

    await kuiklyPage.page.getByText('区域 B').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前区域: B')).toBeVisible();

    await kuiklyPage.page.getByText('区域 C').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('当前区域: C')).toBeVisible();
  });

  test('点击区域后应更新操作日志', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('操作日志: 等待操作...')).toBeVisible();

    await kuiklyPage.page.getByText('区域 B').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('操作日志: 点击了区域 B')).toBeVisible();
  });

  test('连续快速点击后计数与日志应继续递增', async ({ kuiklyPage }) => {
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

  test('长按二次触发后应恢复未激活状态', async ({ kuiklyPage }) => {
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
