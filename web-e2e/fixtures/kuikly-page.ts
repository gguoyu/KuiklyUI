import { Page, Locator, expect } from '@playwright/test';

/**
 * KuiklyPage Fixture - Core utility class for Kuikly Web E2E testing
 * Encapsulates Kuikly-specific operations and interactions
 */
export class KuiklyPage {
  constructor(public readonly page: Page) {}

  // ==================== Navigation & Waiting ====================

  /**
   * Navigate to a test page using page_name parameter
   * @param pageName - Test page name, e.g., 'KRListViewTestPage'
   * @example await kuiklyPage.goto('?page_name=KRListViewTestPage')
   */
  async goto(pageName: string): Promise<void> {
    // Ensure pageName starts with ?page_name= or is a full query string
    const url = pageName.startsWith('?') ? pageName : `?page_name=${pageName}`;
    await this.page.goto(url);
  }

  /**
   * Wait for Kuikly render to complete
   * Monitors for specific flags or idle state
   * @param timeout - Maximum wait time in ms (default: 30000)
   */
  async waitForRenderComplete(timeout: number = 30000): Promise<void> {
    // Strategy 1: Wait for network idle
    await this.page.waitForLoadState('networkidle', { timeout });
    
    // Strategy 2: Wait for a short period to ensure render stabilization
    // This helps catch any delayed render updates
    await this.page.waitForTimeout(100);
    
    // Strategy 3: Check if there's a render completion flag (future enhancement)
    // await this.page.waitForFunction(() => window.__kuikly_render_complete === true);
  }

  // ==================== Component Locating ====================

  /**
   * Locate elements by data-kuikly-component attribute
   * @param type - Component type name, e.g., 'KRListView', 'KRView'
   * @returns Playwright Locator for the component
   * @example kuiklyPage.component('KRListView').first()
   */
  component(type: string): Locator {
    return this.page.locator(`[data-kuikly-component="${type}"]`);
  }

  /**
   * Get all elements with a specific component type
   * @param type - Component type name
   * @returns Array of Locators for all matching components
   * @example const views = await kuiklyPage.components('KRView')
   */
  async components(type: string): Promise<Locator[]> {
    return await this.page.locator(`[data-kuikly-component="${type}"]`).all();
  }

  /**
   * Get component tree structure (for debugging)
   * Returns information about all Kuikly components on the page
   */
  async getComponentTree(): Promise<ComponentNode[]> {
    return await this.page.evaluate(() => {
      const components: ComponentNode[] = [];
      const elements = document.querySelectorAll('[data-kuikly-component]');
      
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        components.push({
          type: htmlEl.getAttribute('data-kuikly-component') || 'unknown',
          id: htmlEl.id,
          tagName: htmlEl.tagName.toLowerCase(),
          className: htmlEl.className,
        });
      });
      
      return components;
    });
  }

  // ==================== Scroll Operations ====================

  /**
   * Get all scrollable containers on the page
   */
  async getScrollContainers(): Promise<Locator[]> {
    const containers = await this.page.locator('[data-kuikly-component]').evaluateAll((elements) => {
      return elements
        .filter((el) => {
          const style = window.getComputedStyle(el);
          return style.overflow === 'scroll' || 
                 style.overflow === 'auto' || 
                 style.overflowY === 'scroll' || 
                 style.overflowY === 'auto';
        })
        .map((el) => (el as HTMLElement).id);
    });
    
    return containers.map((id) => this.page.locator(`#${id}`));
  }

  /**
   * Scroll within a specific container
   * @param container - Target container locator
   * @param options - Scroll options (deltaX, deltaY, smooth)
   */
  async scrollInContainer(
    container: Locator,
    options: { deltaX?: number; deltaY?: number; smooth?: boolean }
  ): Promise<void> {
    const { deltaX = 0, deltaY = 0, smooth = true } = options;
    
    await container.evaluate((el, { x, y, smooth }) => {
      el.scrollBy({
        left: x,
        top: y,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }, { x: deltaX, y: deltaY, smooth });
    
    // Wait for scroll to complete
    await this.page.waitForTimeout(smooth ? 300 : 100);
  }

  /**
   * Swipe gesture within a container
   * @param container - Target container locator
   * @param options - Swipe direction and distance
   */
  async swipeInContainer(
    container: Locator,
    options: { direction: 'up' | 'down' | 'left' | 'right'; distance: number }
  ): Promise<void> {
    const box = await container.boundingBox();
    if (!box) throw new Error('Container not found or not visible');

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    let endX = startX;
    let endY = startY;

    switch (options.direction) {
      case 'up':
        endY -= options.distance;
        break;
      case 'down':
        endY += options.distance;
        break;
      case 'left':
        endX -= options.distance;
        break;
      case 'right':
        endX += options.distance;
        break;
    }

    // Perform swipe gesture
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.mouse.up();
    
    // Wait for swipe animation
    await this.page.waitForTimeout(300);
  }

  // ==================== Animation Operations ====================

  /**
   * Capture animation frames as screenshots
   * @param options - Interval and max duration
   * @returns Array of screenshot buffers
   */
  async captureAnimationFrames(options: {
    interval: number;
    maxDuration: number;
  }): Promise<Buffer[]> {
    const frames: Buffer[] = [];
    const startTime = Date.now();
    
    while (Date.now() - startTime < options.maxDuration) {
      const screenshot = await this.page.screenshot();
      frames.push(screenshot);
      await this.page.waitForTimeout(options.interval);
    }
    
    return frames;
  }

  /**
   * Wait for all CSS transitions/animations to complete
   */
  async waitForAnimationEnd(): Promise<void> {
    await this.page.waitForFunction(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.animationName !== 'none' || style.transitionProperty !== 'none') {
          return false;
        }
      }
      return true;
    }, { timeout: 5000 }).catch(() => {
      // Fallback: just wait a fixed time
      return this.page.waitForTimeout(1000);
    });
  }

  /**
   * Wait for transitionend event on a specific element
   */
  async waitForTransitionEnd(locator: Locator): Promise<void> {
    await locator.evaluate((el) => {
      return new Promise<void>((resolve) => {
        const handler = () => {
          el.removeEventListener('transitionend', handler);
          resolve();
        };
        el.addEventListener('transitionend', handler);
        // Fallback timeout
        setTimeout(resolve, 2000);
      });
    });
  }

  /**
   * Get computed styles of an element
   */
  async getComputedStyles(locator: Locator, properties: string[]): Promise<Record<string, string>> {
    return await locator.evaluate((el, props) => {
      const style = window.getComputedStyle(el);
      const result: Record<string, string> = {};
      props.forEach((prop) => {
        result[prop] = style.getPropertyValue(prop);
      });
      return result;
    }, properties);
  }
}

/**
 * Component node information
 */
export interface ComponentNode {
  type: string;
  id: string;
  tagName: string;
  className: string;
}
