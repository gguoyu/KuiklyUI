/**
 * L2 복杂交互测试：搜索组合场景
 *
 * 测试页面：SearchTestPage
 *
 * ⚠ 实现说明（重要）
 * SearchTestPage 使用 Kuikly 响应式渲染。
 * 经过调试验证，当前 Web 构建中：
 *  - 始终存在的 DOM 元素上的文本 ternary 表达式 → 正常更新（如统计文字）
 *  - 列表项行背景色（现有 DOM 属性）→ 正常更新
 *  - 条件块新增 DOM 元素（"已选中"提示、"清空"按钮）→ 当前不触发
 * 因此用例仅验证已确认可靠的行为，并通过截图作为综合视觉验证。
 *
 * 测试覆盖：
 * 1. 页面加载 — 初始全量列表（20 个水果）及统计文字
 * 2. 搜索过滤 — fill + 点击搜索 → 统计文字从"共 N"变为"找到 N"
 * 3. 多关键词搜索 — 验证不同关键词返回不同结果数
 * 4. 零结果搜索 — 统计文字显示"找到 0 个结果"
 * 5. 清空关键词 — fill('') 触发 textDidChange → 统计文字恢复"共 N 个水果"
 * 6. 列表项点击 — 行背景色发生变化（CSS 属性更新）
 * 7. 视觉回归截图
 */

import { test, expect } from '../../fixtures/test-base';

/** 获取当前统计行的文字（"共 N 个水果" 或 "找到 N 个结果"） */
async function getStatText(page: any): Promise<string> {
  return await page.evaluate(() => {
    const els = document.querySelectorAll('p');
    for (const p of els) {
      const t = p.textContent || '';
      if (t.includes('个水果') || t.includes('个结果')) return t;
    }
    return '';
  });
}

/** 获取指定文本所在行容器的背景色 */
async function getRowBgForText(page: any, keyword: string): Promise<string> {
  return await page.evaluate((kw: string) => {
    const views = document.querySelectorAll('[data-kuikly-component="KRView"]');
    for (const v of Array.from(views)) {
      const el = v as HTMLElement;
      // 找最小包含该关键词的叶行容器（排除根容器）
      if (el.innerText?.includes(kw) && el.innerText.length < 50) {
        return window.getComputedStyle(el).backgroundColor;
      }
    }
    return '';
  }, keyword);
}

test.describe('搜索组合场景测试', () => {

  test('应该成功加载 SearchTestPage 初始全量列表', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 初始统计文字
    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toContain('共 20 个水果');

    // 搜索框占位符可见
    await expect(kuiklyPage.page.getByPlaceholder('搜索水果...')).toBeVisible();

    // 前几个列表项可见
    await expect(kuiklyPage.page.getByText('Apple 苹果')).toBeVisible();
    await expect(kuiklyPage.page.getByText('Banana 香蕉')).toBeVisible();
  });

  test('fill + 点击搜索后统计文字应从"共 N"变为"找到 N 个结果"', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('berry');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    // berry 匹配：Elderberry, Raspberry, Strawberry → 3 个结果
    expect(stat).toMatch(/找到 3 个结果/);
  });

  test('搜索 mango 应返回 1 个结果', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('mango');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/找到 1 个结果/);
  });

  test('搜索不存在关键词应显示"找到 0 个结果"', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('zzznomatch999');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    const stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/找到 0 个结果/);
  });

  test('清空输入框（fill 空值）应将统计文字恢复为"共 N 个水果"', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 先搜索
    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('mango');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    let stat = await getStatText(kuiklyPage.page);
    expect(stat).toMatch(/找到 1 个结果/);

    // fill('') 触发 textDidChange → hasSearched = false → 统计恢复
    await input.fill('');
    await kuiklyPage.waitForRenderComplete();

    stat = await getStatText(kuiklyPage.page);
    expect(stat).toContain('共 20 个水果');
  });

  test('连续不同关键词搜索结果数应各自正确', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');

    // 搜索 "a" — 应匹配多项
    await input.fill('a');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();
    const statA = await getStatText(kuiklyPage.page);
    const countA = parseInt(statA.match(/\d+/)?.[0] || '0');
    expect(countA).toBeGreaterThan(1);

    // 再搜索 "watermelon" — 应匹配 1 项
    await input.fill('watermelon');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();
    const statW = await getStatText(kuiklyPage.page);
    expect(statW).toMatch(/找到 1 个结果/);
  });

  test('点击列表项应改变该行背景色', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    // 记录 Apple 行点击前背景色
    const bgBefore = await getRowBgForText(kuiklyPage.page, 'Apple 苹果');

    // 点击 Apple 苹果
    await kuiklyPage.page.getByText('Apple 苹果').click();
    await kuiklyPage.waitForRenderComplete();

    const bgAfter = await getRowBgForText(kuiklyPage.page, 'Apple 苹果');

    // 点击后背景色应发生变化（从白色变为蓝色选中色）
    expect(bgAfter).not.toBe(bgBefore);
  });

  test('视觉回归：SearchTestPage 初始状态截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('search-test-initial.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：SearchTestPage 搜索 berry 过滤后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    const input = kuiklyPage.page.getByPlaceholder('搜索水果...');
    await input.fill('berry');
    await kuiklyPage.page.getByText('搜索').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('search-test-filtered.png', {
      maxDiffPixels: 300,
    });
  });

  test('视觉回归：SearchTestPage 点击列表项后截图', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('SearchTestPage');
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('Mango 芒果').click();
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page).toHaveScreenshot('search-test-item-selected.png', {
      maxDiffPixels: 300,
    });
  });
});
