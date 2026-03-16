/**
 * KuiklyUI Demo 页面列表
 * 从 demo/src/commonMain/kotlin 中的 @Page 注解自动提取
 *
 * 页面通过 URL 参数 ?page_name=xxx 访问
 */

import type { Page } from '@playwright/test';

/* ─── 交互步骤类型定义 ─── */

/** 点击操作 */
export interface ClickStep {
  action: 'click';
  /** CSS 选择器（优先） */
  selector?: string;
  /** 基于文本内容匹配 */
  text?: string;
  /** 坐标点击（相对于视口） */
  position?: { x: number; y: number };
}

/** 滚动操作 —— 作用于具体 div 容器，而非 window */
export interface ScrollStep {
  action: 'scroll';
  /** 滚动容器的 CSS 选择器，默认 '#root > div > div'（Kuikly 根滚动容器） */
  containerSelector?: string;
  /** 水平滚动距离 (px)，正值向右 */
  deltaX?: number;
  /** 垂直滚动距离 (px)，正值向下 */
  deltaY?: number;
}

/** 悬停操作 */
export interface HoverStep {
  action: 'hover';
  selector?: string;
  position?: { x: number; y: number };
}

/** 拖拽/滑动操作 */
export interface SwipeStep {
  action: 'swipe';
  /** 起点 */
  from: { x: number; y: number };
  /** 终点 */
  to: { x: number; y: number };
  /** 滑动时长(ms)，默认 300 */
  duration?: number;
}

/** 输入操作 */
export interface InputStep {
  action: 'input';
  /** 输入框选择器 */
  selector: string;
  /** 输入内容 */
  text: string;
  /** 是否先清空，默认 true */
  clear?: boolean;
}

/** 等待操作 */
export interface WaitStep {
  action: 'wait';
  /** 等待时间(ms) */
  duration: number;
}

/** 所有交互步骤的联合类型 */
export type InteractionStep =
  | ClickStep
  | ScrollStep
  | HoverStep
  | SwipeStep
  | InputStep
  | WaitStep;

/** 一组交互 + 对应截图 */
export interface InteractionGroup {
  /** 该组截图的后缀名，如 'scrolled' → PageName-scrolled.png */
  screenshotSuffix: string;
  /** 截图前执行的交互步骤（按顺序执行） */
  steps: InteractionStep[];
  /** 执行完 steps 后的额外等待时间(ms)，默认 1000 */
  waitAfter?: number;
}

/* ─── 页面条目定义 ─── */

export interface PageEntry {
  /** @Page 注解中的页面名称 */
  name: string;
  /** 页面分类标签 */
  category: string;
  /** 是否跳过测试（某些页面可能依赖原生能力无法在纯 web 测试） */
  skip?: boolean;
  /** 自定义等待时间(ms)，默认 2000 */
  waitTime?: number;

  /**
   * 声明式交互组（方案 C 的数据驱动部分）
   * 每组会先执行 steps，再截一张带 suffix 的图
   * 不提供时只截初始状态图
   */
  interactions?: InteractionGroup[];

  /**
   * 完全自定义的测试函数（方案 C 的独立脚本部分）
   * 提供此函数时，循环会用它替代默认的"加载→截图"流程
   * 函数内需自行完成所有交互和 expect 断言
   */
  customTest?: (page: Page) => Promise<void>;
}

/* ─── 常用交互预设，减少重复配置 ─── */

/** 预设：向下滚动一屏 */
export const SCROLL_DOWN: InteractionGroup = {
  screenshotSuffix: 'scrolled',
  steps: [{ action: 'scroll', deltaY: 600 }],
  waitAfter: 1000,
};

/** 预设：向下滚动半屏 */
export const SCROLL_DOWN_HALF: InteractionGroup = {
  screenshotSuffix: 'scrolled',
  steps: [{ action: 'scroll', deltaY: 300 }],
  waitAfter: 1000,
};

/** 预设：水平向右滚动 */
export const SCROLL_RIGHT: InteractionGroup = {
  screenshotSuffix: 'scrolled-right',
  steps: [{ action: 'scroll', deltaX: 300 }],
  waitAfter: 1000,
};

export const pages: PageEntry[] = [
  /* ═══════════════════════════════════════════════════════════════════════════
   * render-test 分类：Web Render 全属性覆盖测试页面
   * 共 22 个页面，覆盖全部 View 组件和 Module 模块
   * ═══════════════════════════════════════════════════════════════════════════ */

  // ─── View 组件测试页面 (13 个) ───

  // 1. 通用 CSS 属性全覆盖
  { name: 'WebRenderTestCommonProps', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 2. KRView 事件属性 (click/doubleClick/longPress/pan/touch)
  { name: 'WebRenderTestViewEvent', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 3. KRImageView 全属性 (src/resize/tintColor/blurRadius)
  { name: 'WebRenderTestImage', category: 'render-test', waitTime: 3000, interactions: [SCROLL_DOWN] },

  // 4. KRRichTextView 全属性 (text/color/fontSize/Span)
  { name: 'WebRenderTestRichText', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 5. KRTextFieldView 全属性 (单行输入)
  { name: 'WebRenderTestTextField', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 6. KRTextAreaView 全属性 (多行输入)
  { name: 'WebRenderTestTextArea', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 7. KRListView/KRScrollView 全属性 (scroll/nested/paging)
  { name: 'WebRenderTestList', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 8. KRVideoView 全属性 (src/muted/resizeMode)
  { name: 'WebRenderTestVideo', category: 'render-test', waitTime: 3000, interactions: [SCROLL_DOWN] },

  // 9. KRCanvasView 全绘图方法 (20+)
  { name: 'WebRenderTestCanvas', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 10. KRActivityIndicatorView (gray/white)
  { name: 'WebRenderTestIndicator', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 11. KRBlurView (不同 blurRadius)
  { name: 'WebRenderTestBlur', category: 'render-test', waitTime: 3000, interactions: [SCROLL_DOWN] },

  // 12. KRHoverView (吸顶效果)
  { name: 'WebRenderTestHover', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 13. KRMaskView (遮罩效果)
  { name: 'WebRenderTestMask', category: 'render-test', waitTime: 3000, interactions: [SCROLL_DOWN] },

  // ─── Module 模块测试页面 (9 个) ───

  // 14. CalendarModule (时间日历)
  { name: 'WebRenderTestCalendar', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 15. CodecModule (编解码)
  { name: 'WebRenderTestCodec', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 16. LogModule (日志)
  { name: 'WebRenderTestLog', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 17. MemoryCacheModule (内存缓存)
  { name: 'WebRenderTestMemoryCache', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 18. SharedPreferencesModule (持久化存储)
  { name: 'WebRenderTestSharedPref', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 19. NotifyModule (事件通知)
  { name: 'WebRenderTestNotify', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 20. RouterModule (路由导航)
  { name: 'WebRenderTestRouter', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 21. NetworkModule (网络请求)
  { name: 'WebRenderTestNetwork', category: 'render-test', interactions: [SCROLL_DOWN] },

  // 22. WindowResizeModule (窗口尺寸)
  { name: 'WebRenderTestWindowResize', category: 'render-test', interactions: [SCROLL_DOWN] },
];

/** 获取所有需要测试的页面（排除 skip 的） */
export function getTestablePages(): PageEntry[] {
  return pages.filter((p) => !p.skip);
}

/** 按分类获取页面 */
export function getPagesByCategory(category: string): PageEntry[] {
  return pages.filter((p) => p.category === category && !p.skip);
}

/** 所有分类列表 */
export const categories = [
  'render-test',
] as const;
