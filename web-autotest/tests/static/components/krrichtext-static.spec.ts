import { test, expect } from '../../../fixtures/test-base';

test.describe('KRRichTextView static 验证', () => {
  test('应该渲染富文本页面和确定性内容', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRRichTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(500);

    await expect(kuiklyPage.page.getByText('1. 多色多样式Span', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('普通文本').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('红色文本').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('蓝色文本').first()).toBeVisible();
    await expect(kuiklyPage.page.getByText('粗体字重', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('斜体文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('下划线文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('删除线文本', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('10号字', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('28号字', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('文本前嵌入图片', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText('图片后文本', { exact: true })).toBeVisible();
  });
});
