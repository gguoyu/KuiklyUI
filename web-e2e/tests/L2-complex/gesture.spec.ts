import { test, expect } from '../../fixtures/test-base';

test.describe('Gesture interaction tests', () => {
  test('loads GestureTestPage', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('1. 水平翻页')).toBeVisible();
    await expect(kuiklyPage.page.getByText('2. 双击事件')).toBeVisible();
    await expect(kuiklyPage.page.getByText('3. 长按事件')).toBeVisible();
    await expect(kuiklyPage.page.getByText('4. 多区域点击')).toBeVisible();
    await expect(kuiklyPage.page.getByText('5. 手势状态面板')).toBeVisible();
  });

  test('horizontal pager stays interactive after swipe', async ({ kuiklyPage }) => {
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

  test('click count increments correctly', async ({ kuiklyPage }) => {
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

  test('long press section keeps stable initial status when no touch long press is injected', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('长按此区域')).toBeVisible();
    await expect(kuiklyPage.page.getByText('长按状态: 未激活')).toBeVisible();
    await expect(kuiklyPage.page.getByText('按住不放约 500ms')).toBeVisible();
  });

  test('tap zones update the active zone label', async ({ kuiklyPage }) => {
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

  test('gesture log updates after zone tap', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('操作日志: 等待操作...')).toBeVisible();
    await kuiklyPage.page.getByText('区域 B').click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('操作日志: 点击了区域 B')).toBeVisible();
  });

  test('visual regression for initial gesture page', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('gesture-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('visual regression after gesture interactions', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('GestureTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('区域 A').click();
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.getByText('快速点击此区域').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('gesture-test-after-interaction.png', {
      maxDiffPixels: 300,
    });
  });
});
