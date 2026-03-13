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
  { name: 'borderTestPage', category: 'demo' },
  { name: 'APNGExamplePage', category: 'demo' },
  // web 尚未支持
  // { name: 'mask_demo', category: 'demo' },
  { name: 'WeatherCanvasPage', category: 'demo' },
  { name: 'line_break_margin', category: 'demo' },
  { name: 'vforlazyAdd', category: 'demo', waitTime: 2000 },
  { name: 'AppSettingPage', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_12"]'}],
      waitAfter: 1000,
    },
    { 
      screenshotSuffix: 'click1',
      steps: [{ action: 'click', selector: '[id="0_14"]'}],
      waitAfter: 1000,
    }
  ] },
  { name: 'AppTabPage', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_11"]'}],
      waitAfter: 1000,
    },
    { 
      screenshotSuffix: 'click1',
      steps: [{ action: 'click', selector: '[id="0_83"]'}],
      waitAfter: 1000,
    }
  ] },
  { name: 'cmp_image_adapter', category: 'demo' },
  { name: 'ImageTintColorReusePage', category: 'demo' },
  { name: 'router', category: 'demo' },
  { name: 'AlertDialogDemo', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_24"]'}],
      waitAfter: 1000,
    }
  ] },
  { name: 'AnimationCancelDemo', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_3"]'}],
      waitAfter: 3000,
    },
    { 
      screenshotSuffix: 'click1',
      steps: [{ action: 'click', selector: '[id="0_4"]'}],
      waitAfter: 3000,
    },
  ]},
  { name: 'BlurViewDemoPage', category: 'demo' },
  { name: 'box_shadow', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_11"]'}],
      waitAfter: 1500,
    }
  ]},
  { name: 'CalendarModuleExamplePage', category: 'demo', interactions: [{
    screenshotSuffix: 'click',
    steps: [{ action: 'click', selector: '[id="0_4"]'}],
    waitAfter: 1000,
  }, {
    screenshotSuffix: 'click1',
    steps: [{ action: 'click', selector: '[id="0_8"]'}],
    waitAfter: 1000,
  }, {
    screenshotSuffix: 'click2',
    steps: [{ action: 'click', selector: '[id="0_13"]'}],
    waitAfter: 1000,
  }, {
    screenshotSuffix: 'click3',
    steps: [{ action: 'click', selector: '[id="0_15"]'}],
    waitAfter: 1000,
  }, {
    screenshotSuffix: 'click4',
    steps: [{ action: 'click', selector: '[id="0_19"]'}],
    waitAfter: 1000,
  }, {
    screenshotSuffix: 'click5',
    steps: [{ action: 'click', selector: '[id="0_23"]'}],
    waitAfter: 1000,
  }]},
  { name: 'CanvasExamplePage', category: 'demo' },
  { name: 'CanvasTestPage', category: 'demo' },
  { name: 'CheckBoxExamplePage', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_12"]'}],
      waitAfter: 1000,
    }
  ] },
  { name: 'clip', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_85"]'}],
      waitAfter: 1000,
    }
  ] },
  { name: 'CodecTestPager', category: 'demo' },
  { name: 'CoroutineExamplePage', category: 'demo', waitTime: 5000 },
  { name: 'CustomPaggingListDemoPage', category: 'demo'},
  { name: 'example', category: 'demo' },
  // 事件输出在控制台，不方便测试，看如何优化
  // { name: 'EventDemoPage', category: 'demo' },
  { name: 'GalleryExamplePage', category: 'demo', interactions: [{
    screenshotSuffix: 'swipe',
    steps: [{ action: 'swipe', from: { x: 375 / 2, y: 812 / 2 }, to: { x: 5, y: 812 / 2 }}],
    waitAfter: 1000,
  }] },
  { name: 'HelloWorldPage', category: 'demo' },
  { name: 'image_demo', category: 'demo', waitTime: 3000 },
  { name: 'input_measure', category: 'demo' },
  // 初始化每次颜色不同，需要修改下demo
  // { name: 'KuiklyPageViewDemo', category: 'demo' },
  { name: 'ListInitContentOfffsetTestPage', category: 'demo', waitTime: 3000, interactions: [
    { 
      screenshotSuffix: 'scrolled',
      steps: [{ action: 'scroll', containerSelector: '[id="0_8"]', deltaX: 0, deltaY: 600 }],
      waitAfter: 1000,
    }
  ] },
  { name: 'maxLength', category: 'demo', interactions: [{
    screenshotSuffix: 'input',
    steps: [{ action: 'input', selector: '[id="0_18"]', text: '1234567890a'}],
    waitAfter: 1000,
  }]},
  { name: 'ModalViewDemoPage', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_14"]'}],
      waitAfter: 1500,
    }
  ] },
  { name: 'NetworkExamplePage', category: 'demo', interactions: [{
    screenshotSuffix: 'click',
    steps: [{ action: 'click', selector: '[id="0_9"]'}],
    waitAfter: 4000,
  },{
    screenshotSuffix: 'click1',
    steps: [{ action: 'click', selector: '[id="0_12"]'}],
    waitAfter: 4000,
  },{
    screenshotSuffix: 'click2',
    steps: [{ action: 'click', selector: '[id="0_16"]'}],
    waitAfter: 4000,
  },{
    screenshotSuffix: 'click3',
    steps: [{ action: 'click', selector: '[id="0_19"]'}],
    waitAfter: 4000,
  }] },
  // 通知有问题，demo待优化
  { name: 'NotifyToHostDemo', category: 'demo' },
  { name: 'OverflowDemoPage', category: 'demo' },
  { name: 'PAGViewDemoPage', category: 'demo', waitTime: 5000 },
  // 性能数据不一定
  // { name: 'PerformancePage', category: 'demo' },
  { name: 'reactive', category: 'demo', waitTime: 15000 },
  { name: 'root_size', category: 'demo' },
  // 延时不定，待优化
  // { name: 'ScreenFrameExamplePage', category: 'demo' },
  { name: 'SkewDemo', category: 'demo' },
  { name: 'SliderExamplePage', category: 'demo' },
  { name: 'SliderPageViewDemoPage', category: 'demo', interactions: [{
    screenshotSuffix: 'wait',
    steps: [{ action: 'wait', duration: 4000 }],
    waitAfter: 50,
  }]},
  { name: 'SwitchExamplePage', category: 'demo', interactions: [{
    screenshotSuffix: 'click',
    steps: [{ action: 'click', selector: '[id="0_8"]'}],
    waitAfter: 1000,
  }, {
    screenshotSuffix: 'click1',
    steps: [{ action: 'click', selector: '[id="0_11"]'}],
    waitAfter: 1000,
  }] },
  { name: 'nestedHorizontalList', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'ToImageExamplePage', category: 'demo' },
  { name: 'ViewBackgroundImageExamplePage', category: 'demo' },
  { name: 'ViewDemoPage', category: 'demo', waitTime: 3000},
  { name: 'ViewExtExamplePage', category: 'demo' },
  // { name: 'vforlazy', category: 'demo' },
  // { name: 'vrefresh', category: 'demo' },
  { name: 'visibleArea', category: 'demo', interactions: [{
    screenshotSuffix: 'scrolled',
    steps: [{ action: 'scroll', containerSelector: '[id="0_26"]', deltaX: 0, deltaY: 300 }],
    waitAfter: 1000,
  }] },
  // 元素不固定，样式不固定，待优化
  // { name: 'WaterfallListDemoPage', category: 'demo', needsInteraction: true},
  { name: 'ActivityIndicatorExamplePage', category: 'demo' },
  { name: 'ButtonExamplePage', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'FlexExamplePage', category: 'demo', interactions: [{
    screenshotSuffix: 'click',
    steps: [{ action: 'click', selector: '[id="0_22"]'}],
    waitAfter: 1000,
  },{
    screenshotSuffix: 'click1',
    steps: [{ action: 'click', selector: '[id="0_40"]'}],
    waitAfter: 1000,
  },{
    screenshotSuffix: 'click2',
    steps: [{ action: 'click', selector: '[id="0_60"]'}],
    waitAfter: 1000,
  },{
    screenshotSuffix: 'click3',
    steps: [{ action: 'click', selector: '[id="0_60"]'}],
    waitAfter: 1000,
  }] },
  { name: 'HoverExamplePage', category: 'demo', interactions: [{
    screenshotSuffix: 'scrolled',
    steps: [{ action: 'scroll', containerSelector: '[id="0_2"]', deltaX: 0, deltaY: 600 }],
    waitAfter: 1000,
  }] },
  { name: 'ListExamplePage', category: 'demo', interactions: [{
    screenshotSuffix: 'scrolled',
    steps: [{ action: 'scroll', containerSelector: '[id="0_10"]', deltaX: 0, deltaY: 600 }],
    waitAfter: 1000,
  },
  {
    screenshotSuffix: 'click',
    steps: [{ action: 'click', selector: '[id="0_9"]' }],
    waitAfter: 1000,
  }] },
  { name: 'TestNewAnimationPage1', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_1"]'}],
      waitAfter: 3000,
     }
  ] },
  { name: 'TestNewAnimationPage2', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_1"]'}],
      waitAfter: 4000,
     }
  ] },
  { name: 'TestNewAnimationPage3', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_1"]'}],
      waitAfter: 4000,
     }
  ] },
  { name: 'TestNewAnimationPage4', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_1"]'}],
      waitAfter: 3000,
     }
  ] },
  { name: 'TestNewAnimationPage5', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_1"]'}],
      waitAfter: 3000,
     }
  ] },
  { name: 'TestNewAnimationPage6', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_1"]'}],
      waitAfter: 3000,
     }
  ] },
  { name: 'TestNewAnimationPage7', category: 'demo',interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_1"]'}],
      waitAfter: 3000,
     }
  ] },
  { name: 'TestNewAnimationPage8', category: 'demo', interactions: [
    { 
      screenshotSuffix: 'click',
      steps: [{ action: 'click', selector: '[id="0_1"]'}],
      waitAfter: 3000,
     }
  ] },
  // 元素背景色不固定，待优化
  { name: 'PageListExamplePage', category: 'demo', interactions: [{
    screenshotSuffix: 'click',
    steps: [{ action: 'click', selector: '[id="0_13"]' }],
    waitAfter: 1000,
  }] },
  { name: 'ScrollPickerExamplePage', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'ScrollViewExamplePage', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'TextExamplePage', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'TransformExamplePage', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'ViewExamplePage', category: 'demo' },
  // 每次位置不固定，不方便测试
  //{ name: 'ZIndexExamplePage', category: 'demo' },
  { name: 'listOverlap', category: 'demo' },
  { name: 'lnest', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'lnestRow', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'lnestno', category: 'demo', interactions: [SCROLL_DOWN] },
  { name: 'listvv', category: 'demo', interactions: [SCROLL_DOWN] },
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
  'demo',
] as const;
