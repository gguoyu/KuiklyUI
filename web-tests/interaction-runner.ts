/**
 * 交互执行引擎
 *
 * 将 page-list.ts 中声明式的 InteractionStep 翻译为 Playwright 操作。
 * 注意：KuiklyUI 的滚动由具体 div 容器承载（overflow: scroll/auto），
 *       而非 window 级别滚动，因此 scroll 操作定位到容器元素上执行。
 */

import type { Page } from '@playwright/test';
import type { InteractionStep, InteractionGroup } from './page-list';

/** 默认滚动容器选择器 —— Kuikly 渲染的根滚动区域 */
const DEFAULT_SCROLL_CONTAINER = '#root [style*="overflow"]';

/**
 * 执行单个交互步骤
 */
async function executeStep(page: Page, step: InteractionStep): Promise<void> {
  switch (step.action) {
    case 'click': {
      if (step.selector) {
        await page.click(step.selector);
      } else if (step.text) {
        await page.getByText(step.text, { exact: false }).first().click();
      } else if (step.position) {
        await page.mouse.click(step.position.x, step.position.y);
      }
      break;
    }

    case 'scroll': {
      const containerSel = step.containerSelector || DEFAULT_SCROLL_CONTAINER;
      const deltaX = step.deltaX ?? 0;
      const deltaY = step.deltaY ?? 0;

      // 尝试找到滚动容器，在其上方执行 wheel 事件
      const container = page.locator(containerSel).first();
      const isVisible = await container.isVisible().catch(() => false);

      if (isVisible) {
        // 将鼠标移到容器中心，然后滚动
        const box = await container.boundingBox();
        if (box) {
          await page.mouse.move(
            box.x + box.width / 2,
            box.y + box.height / 2,
          );
          await page.mouse.wheel(deltaX, deltaY);
        }
      } else {
        // 兜底：在页面中心执行 wheel
        const viewport = page.viewportSize() ?? { width: 375, height: 812 };
        await page.mouse.move(viewport.width / 2, viewport.height / 2);
        await page.mouse.wheel(deltaX, deltaY);
      }
      break;
    }

    case 'hover': {
      if (step.selector) {
        await page.hover(step.selector);
      } else if (step.position) {
        await page.mouse.move(step.position.x, step.position.y);
      }
      break;
    }

    case 'swipe': {
      const duration = step.duration ?? 300;
      const steps = Math.max(Math.round(duration / 16), 5); // ~60fps
      await page.mouse.move(step.from.x, step.from.y);
      await page.mouse.down();
      await page.mouse.move(step.to.x, step.to.y, { steps });
      await page.mouse.up();
      break;
    }

    case 'input': {
      const clear = step.clear !== false; // 默认 true
      if (clear) {
        await page.locator(step.selector).first().fill(step.text);
      } else {
        await page.locator(step.selector).first().type(step.text);
      }
      break;
    }

    case 'wait': {
      await page.waitForTimeout(step.duration);
      break;
    }
  }
}

/**
 * 执行一组交互步骤
 */
export async function runInteractionGroup(
  page: Page,
  group: InteractionGroup,
): Promise<void> {
  for (const step of group.steps) {
    await executeStep(page, step);
  }
  // 步骤全部执行完后等待渲染稳定
  const waitAfter = group.waitAfter ?? 1000;
  if (waitAfter > 0) {
    await page.waitForTimeout(waitAfter);
  }
}
