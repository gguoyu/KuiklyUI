/**
 * KuiklyUI Demo 页面列表
 * 从 demo/src/commonMain/kotlin 中的 @Page 注解自动提取
 *
 * 页面通过 URL 参数 ?page_name=xxx 访问
 */

/** 页面分类 */
export interface PageEntry {
  /** @Page 注解中的页面名称 */
  name: string;
  /** 页面分类标签 */
  category: string;
  /** 是否需要交互后才能截图（如需要点击、滑动等） */
  needsInteraction?: boolean;
  /** 是否跳过测试（某些页面可能依赖原生能力无法在纯 web 测试） */
  skip?: boolean;
  /** 自定义等待时间(ms)，默认 2000 */
  waitTime?: number;
}

export const pages: PageEntry[] = [
  // ==================== 根目录页面 ====================
  { name: 'borderTestPage', category: 'root' },
  { name: 'APNGExamplePage', category: 'root' },
  // web 尚未支持
  // { name: 'mask_demo', category: 'root' },
  { name: 'WeatherCanvasPage', category: 'root' },
  { name: 'line_break_margin', category: 'root' },
  { name: 'vforlazyAdd', category: 'root', waitTime: 2000},

  // ==================== App 页面 ====================
  { name: 'AppSettingPage', category: 'app', needsInteraction: true},
  { name: 'AppTabPage', category: 'app', needsInteraction: true},

  // ==================== 图片适配器页面 ====================
  { name: 'cmp_image_adapter', category: 'image-adapter' },
  { name: 'ImageTintColorReusePage', category: 'image-adapter' },

  // ==================== 路由页面 ====================
  { name: 'router', category: 'router' },

  // ==================== Demo 声明式页面 ====================
  { name: 'AlertDialogDemo', category: 'demo' },
  { name: 'AnimationCancelDemo', category: 'demo', waitTime: 3000 },
  { name: 'BlurViewDemoPage', category: 'demo' },
  { name: 'box_shadow', category: 'demo' },
  { name: 'CalendarModuleExamplePage', category: 'demo' },
  { name: 'CanvasExamplePage', category: 'demo' },
  { name: 'CanvasTestPage', category: 'demo' },
  { name: 'CheckBoxExamplePage', category: 'demo', needsInteraction: true},
  { name: 'clip', category: 'demo', needsInteraction: true},
  { name: 'CodecTestPager', category: 'demo' },
  { name: 'CoroutineExamplePage', category: 'demo', waitTime: 5000},
  { name: 'CustomPaggingListDemoPage', category: 'demo', needsInteraction: true},
  { name: 'example', category: 'demo', needsInteraction: true},
  // 事件输出在控制台，不方便测试，看如何优化
  // { name: 'EventDemoPage', category: 'demo', needsInteraction: true },
  { name: 'GalleryExamplePage', category: 'demo', needsInteraction: true},
  { name: 'HelloWorldPage', category: 'demo' },
  { name: 'image_demo', category: 'demo', waitTime: 3000},
  { name: 'input_measure', category: 'demo' },
  // 初始化每次颜色不同，需要修改下demo
  // { name: 'KuiklyPageViewDemo', category: 'demo' },
  { name: 'ListInitContentOfffsetTestPage', category: 'demo', needsInteraction: true},
  { name: 'maxLength', category: 'demo', needsInteraction: true},
  { name: 'ModalViewDemoPage', category: 'demo', needsInteraction: true},
  { name: 'NetworkExamplePage', category: 'demo', needsInteraction: true},
  // 通知有问题，demo待优化
  { name: 'NotifyToHostDemo', category: 'demo' },
  { name: 'OverflowDemoPage', category: 'demo', needsInteraction: true},
  { name: 'PAGViewDemoPage', category: 'demo', waitTime: 5000},
  // 性能数据不一定
  // { name: 'PerformancePage', category: 'demo' },
  { name: 'PinchGestureExampleDemo', category: 'demo', needsInteraction: true },
  { name: 'reactive', category: 'demo', waitTime: 15000},
  { name: 'root_size', category: 'demo' },
  // 延时不定，待优化
  // { name: 'ScreenFrameExamplePage', category: 'demo',  },
  { name: 'SkewDemo', category: 'demo' },
  { name: 'SliderExamplePage', category: 'demo', needsInteraction: true },
  { name: 'SliderPageViewDemoPage', category: 'demo' },
  { name: 'SwitchExamplePage', category: 'demo', needsInteraction: true },

  { name: 'nestedHorizontalList', category: 'demo', needsInteraction: true },
  { name: 'ToImageExamplePage', category: 'demo', needsInteraction: true},
  { name: 'ViewBackgroundImageExamplePage', category: 'demo' },
  { name: 'ViewDemoPage', category: 'demo' },
  { name: 'ViewExtExamplePage', category: 'demo' },
  // { name: 'vforlazy', category: 'demo' },
  // { name: 'vrefresh', category: 'demo' },
  { name: 'visibleArea', category: 'demo', needsInteraction: true},
  { name: 'WaterfallListDemoPage', category: 'demo', needsInteraction: true},

  // ==================== Kit DeclarativeDemo 页面 ====================
  { name: 'ActivityIndicatorExamplePage', category: 'kit' },
  { name: 'ButtonExamplePage', category: 'kit', needsInteraction: true},
  { name: 'FlexExamplePage', category: 'kit', needsInteraction: true},
  { name: 'HoverExamplePage', category: 'kit', needsInteraction: true},
  { name: 'ListExamplePage', category: 'kit', needsInteraction: true},
  { name: 'TestNewAnimationPage1', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage2', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage3', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage4', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage5', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage6', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage7', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage8', category: 'kit', waitTime: 3000 },
  { name: 'PageListExamplePage', category: 'kit', needsInteraction: true},
  { name: 'ScrollPickerExamplePage', category: 'kit', needsInteraction: true},
  { name: 'ScrollViewExamplePage', category: 'kit', needsInteraction: true},
  { name: 'TextExamplePage', category: 'kit', needsInteraction: true},
  { name: 'TransformExamplePage', category: 'kit', needsInteraction: true},
  { name: 'ViewExamplePage', category: 'kit' },
  // 每次位置不固定，不方便测试
  //{ name: 'ZIndexExamplePage', category: 'kit' },

  // ==================== List 页面 ====================
  { name: 'listOverlap', category: 'list' },
  { name: 'lnest', category: 'list', needsInteraction: true },
  { name: 'lnestRow', category: 'list', needsInteraction: true },
  { name: 'lnestno', category: 'list', needsInteraction: true },
  { name: 'listvv', category: 'list', needsInteraction: true },
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
  'root',
  'app',
  'image-adapter',
  'network',
  'router',
  'compose',
  'demo',
  'kit',
  'list',
] as const;
