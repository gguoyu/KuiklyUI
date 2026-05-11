import { Page, Locator } from '@playwright/test';
/**
 * KuiklyPage Fixture - Core utility class for Kuikly Web E2E testing
 * Encapsulates Kuikly-specific operations and interactions
 */
export declare class KuiklyPage {
    readonly page: Page;
    constructor(page: Page);
    /**
     * Navigate to a test page using page_name parameter
     * @param pageName - Test page name, e.g., 'KRListViewTestPage'
     * @example await kuiklyPage.goto('?page_name=KRListViewTestPage')
     */
    goto(pageName: string): Promise<void>;
    /**
     * Wait for Kuikly render to complete
     * Monitors for specific flags or idle state
     * @param timeout - Maximum wait time in ms (default: 30000)
     */
    waitForRenderComplete(timeout?: number): Promise<void>;
    /**
     * Locate elements by data-kuikly-component attribute
     * @param type - Component type name, e.g., 'KRListView', 'KRView'
     * @returns Playwright Locator for the component
     * @example kuiklyPage.component('KRListView').first()
     */
    component(type: string): Locator;
    /**
     * Get all elements with a specific component type
     * @param type - Component type name
     * @returns Array of Locators for all matching components
     * @example const views = await kuiklyPage.components('KRView')
     */
    components(type: string): Promise<Locator[]>;
    /**
     * Get component tree structure (for debugging)
     * Returns information about all Kuikly components on the page
     */
    getComponentTree(): Promise<ComponentNode[]>;
    /**
     * Get all scrollable containers on the page
     */
    getScrollContainers(): Promise<Locator[]>;
    /**
     * Scroll within a specific container
     * @param container - Target container locator
     * @param options - Scroll options (deltaX, deltaY, smooth)
     */
    scrollInContainer(container: Locator, options: {
        deltaX?: number;
        deltaY?: number;
        smooth?: boolean;
    }): Promise<void>;
    /**
     * Swipe gesture within a container
     * @param container - Target container locator
     * @param options - Swipe direction and distance
     */
    swipeInContainer(container: Locator, options: {
        direction: 'up' | 'down' | 'left' | 'right';
        distance: number;
    }): Promise<void>;
    /**
     * Scroll a KRListView container to the bottom.
     * Kuikly List uses virtual scrolling so window.scrollTo() has no effect —
     * you must set scrollTop on the list container element directly.
     * @param container - Locator for the KRListView element
     */
    scrollListToBottom(container: Locator): Promise<void>;
    /**
     * Fill an input/textarea element and dispatch DOM events so that Kuikly's
     * event listeners (textDidChange, focus, input, change) are triggered.
     *
     * Playwright's built-in fill() sets element.value directly without
     * dispatching a DOM 'input' event, so Kuikly's addEventListener('input')
     * callback never fires. This method works around that limitation.
     *
     * @param locator - Locator for the input or textarea element
     * @param text - Text to fill
     */
    fillInput(locator: Locator, text: string): Promise<void>;
    /**
     * Clear an input/textarea element.
     *
     * Playwright's fill('') is the most reliable clear path in the current
     * Kuikly web test setup and correctly propagates the empty value.
     *
     * @param locator - Locator for the input or textarea element
     */
    clearInput(locator: Locator): Promise<void>;
    /**
     * Make subsequent navigations report coarse pointer media queries.
     *
     * Call this before goto()/reload() when a test needs the touch-specific
     * runtime branch guarded by matchMedia('(pointer: coarse)').
     */
    installCoarsePointerMode(): Promise<void>;
    /**
     * Force-click an element by dispatching a MouseEvent directly on the DOM.
     * Useful when Playwright's click() fails due to element occlusion or
     * Kuikly layout quirks where the computed click target is wrong.
     *
     * @param locator - Locator for the element to click
     */
    forceClick(locator: Locator): Promise<void>;
    /**
     * Capture animation frames as screenshots
     * @param options - Interval and max duration
     * @returns Array of screenshot buffers
     */
    captureAnimationFrames(options: {
        interval: number;
        maxDuration: number;
    }): Promise<Buffer[]>;
    /**
     * Wait for all CSS transitions/animations to complete
     */
    waitForAnimationEnd(): Promise<void>;
    /**
     * Wait for transitionend event on a specific element
     */
    waitForTransitionEnd(locator: Locator): Promise<void>;
    /**
     * Get computed styles of an element
     */
    getComputedStyles(locator: Locator, properties: string[]): Promise<Record<string, string>>;
    /**
     * Compare two screenshot buffers and decide if they visually differ.
     * Uses a simple byte-level comparison; for production use a pixel-diff
     * library (e.g. pixelmatch), but this is sufficient for CI gate checks.
     *
     * @param a - First screenshot buffer
     * @param b - Second screenshot buffer
     * @param options - threshold: min fraction of bytes that must differ (default 0.001)
     */
    framesDiffer(a: Buffer, b: Buffer, options?: {
        threshold?: number;
    }): boolean;
    /**
     * Count how many consecutive frame-pairs in a sequence visually differ.
     * e.g. for frames [A, B, C, D]: compares A↔B, B↔C, C↔D → returns count of differing pairs.
     *
     * @param frames - Array of screenshot buffers captured during animation
     * @param options - threshold passed through to framesDiffer
     */
    countFrameDiffs(frames: Buffer[], options?: {
        threshold?: number;
    }): number;
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
