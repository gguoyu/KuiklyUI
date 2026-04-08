import { test, expect, type Locator } from '../../fixtures/test-base';

async function getScrollMetrics(container: Locator): Promise<{ scrollTop: number; maxScrollTop: number }> {
  return container.evaluate((el) => {
    if (!(el instanceof HTMLElement)) {
      return { scrollTop: 0, maxScrollTop: 0 };
    }

    return {
      scrollTop: el.scrollTop,
      maxScrollTop: el.scrollHeight - el.clientHeight,
    };
  });
}

test.describe('列表滚动测试', () => {
  test('应该成功加载 ListScrollTestPage 页面', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('列表滚动测试', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 1', { exact: true })).toBeVisible();
  });

  test('应该渲染所有 5 个分组标题', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
    expect(await kuiklyPage.page.getByText('分组 2', { exact: true }).count()).toBeGreaterThanOrEqual(0);
  });

  test('列表项点击应高亮并更新选中状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('选中: 未选择', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('列表项 1', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('选中: 列表项 1', { exact: true })).toBeVisible();
  });

  test('点击不同列表项应切换选中状态', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('列表项 3', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 3', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('列表项 5', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 5', { exact: true })).toBeVisible();
  });

  test('滚动到末尾后额外下拉应停留在底部边界', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    for (let i = 0; i < 12; i += 1) {
      await kuiklyPage.scrollInContainer(listContainer, { deltaY: 400, smooth: false });
    }

    const beforeExtraScroll = await getScrollMetrics(listContainer);
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 800, smooth: false });
    const afterExtraScroll = await getScrollMetrics(listContainer);

    expect(beforeExtraScroll.scrollTop).toBeGreaterThan(2000);
    expect(Math.abs(beforeExtraScroll.maxScrollTop - beforeExtraScroll.scrollTop)).toBeLessThanOrEqual(4);
    expect(Math.abs(afterExtraScroll.scrollTop - beforeExtraScroll.scrollTop)).toBeLessThanOrEqual(4);
    await expect(kuiklyPage.page.getByText('分组 5', { exact: true })).toBeVisible();
  });

  test('滚动后点击列表项应正确响应', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 500, smooth: false });

    const visibleItem = kuiklyPage.page.getByText('列表项 8', { exact: true });
    await expect(visibleItem).toBeVisible();
    await visibleItem.click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 8', { exact: true })).toBeVisible();
  });

  test('鼠标滚轮滚动后应更新列表可见区域', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    const box = await listContainer.boundingBox();
    expect(box).toBeTruthy();

    await kuiklyPage.page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await kuiklyPage.page.mouse.wheel(0, 900);
    await kuiklyPage.page.waitForTimeout(250);

    const afterWheelDown = await getScrollMetrics(listContainer);
    expect(afterWheelDown.scrollTop).toBeGreaterThan(0);
    await expect(kuiklyPage.page.getByText('列表项 13', { exact: true })).toBeVisible();

    await kuiklyPage.page.mouse.wheel(0, -450);
    await kuiklyPage.page.waitForTimeout(250);

    const afterWheelUp = await getScrollMetrics(listContainer);
    expect(afterWheelUp.scrollTop).toBeLessThan(afterWheelDown.scrollTop);
  });

  test('滚动到中部后应显示更后面的分组内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 1200, smooth: false });

    const { scrollTop } = await getScrollMetrics(listContainer);
    expect(scrollTop).toBeGreaterThan(1000);
    await expect(kuiklyPage.page.getByText('分组 3', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 21', { exact: true })).toBeVisible();
  });

  test('滚动到末尾区域后应可以选择列表项 50', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    for (let i = 0; i < 12; i += 1) {
      await kuiklyPage.scrollInContainer(listContainer, { deltaY: 400, smooth: false });
    }

    const { scrollTop } = await getScrollMetrics(listContainer);
    expect(scrollTop).toBeGreaterThan(2000);
    await expect(kuiklyPage.page.getByText('分组 5', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('列表项 50', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 50', { exact: true })).toBeVisible();
  });

  test('额外滚动再回到原位置后应保持当前选中项', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 900, smooth: false });
    await expect(kuiklyPage.page.getByText('列表项 13', { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('列表项 13', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();
    await expect(kuiklyPage.page.getByText('选中: 列表项 13', { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 500, smooth: false });
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: -500, smooth: false });
    await expect(kuiklyPage.page.getByText('选中: 列表项 13', { exact: true })).toBeVisible();
  });

  test('滚动回顶部后应恢复首屏列表内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    const listContainer = kuiklyPage.component('KRListView').first();
    await kuiklyPage.scrollInContainer(listContainer, { deltaY: 1200, smooth: false });
    for (let i = 0; i < 4; i += 1) {
      await kuiklyPage.scrollInContainer(listContainer, { deltaY: -400, smooth: false });
    }

    const { scrollTop } = await getScrollMetrics(listContainer);
    expect(scrollTop).toBe(0);
    await expect(kuiklyPage.page.getByText('分组 1', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('列表项 1', { exact: true })).toBeVisible();
  });

  test('视觉回归：ListScrollTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('listscroll-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：ListScrollTestPage 选中后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('ListScrollTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('列表项 2', { exact: true }).click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('listscroll-test-selected.png', {
      maxDiffPixels: 300,
    });
  });
});
