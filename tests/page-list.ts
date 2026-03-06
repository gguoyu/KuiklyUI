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
  { name: 'DiffUpdateTestPage', category: 'root' },
  { name: 'APNGExamplePage', category: 'root' },
  { name: 'BackPressHandlerPager', category: 'root' },
  { name: 'mask_demo', category: 'root' },
  { name: 'NativeCallPage', category: 'root' },
  { name: 'TBTest', category: 'root' },
  { name: 'WeatherCanvasPage', category: 'root' },
  { name: 'line_height_bug_page', category: 'root' },
  { name: 'line_break_margin', category: 'root' },
  { name: 'vforlazyAdd', category: 'root' },

  // ==================== App 页面 ====================
  { name: 'AppSettingPage', category: 'app' },
  { name: 'AppTabPage', category: 'app' },

  // ==================== 图片适配器页面 ====================
  { name: 'cmp_image_adapter', category: 'image-adapter' },
  { name: 'image_adapter', category: 'image-adapter' },
  { name: 'ImageTintColorReusePage', category: 'image-adapter' },

  // ==================== 网络页面 ====================
  { name: 'network', category: 'network', skip: true },

  // ==================== 路由页面 ====================
  { name: 'router', category: 'router' },

  // ==================== Demo 声明式页面 ====================
  { name: 'AlertDialogDemo', category: 'demo' },
  { name: 'AnimationCancelDemo', category: 'demo', waitTime: 3000 },
  { name: 'ImperativeAnimationExamplePage', category: 'demo', waitTime: 3000 },
  { name: 'BlurViewDemoPage', category: 'demo' },
  { name: 'BorderRadiusIssuePage', category: 'demo' },
  { name: 'box_shadow', category: 'demo' },
  { name: 'CalendarModuleExamplePage', category: 'demo' },
  { name: 'CanvasExamplePage', category: 'demo' },
  { name: 'CanvasTestPage', category: 'demo' },
  { name: 'CheckBoxExamplePage', category: 'demo' },
  { name: 'clip', category: 'demo' },
  { name: 'CodecTestPager', category: 'demo' },
  { name: 'compat', category: 'demo' },
  { name: 'CoroutineExamplePage', category: 'demo' },
  { name: 'CustomPaggingListDemoPage', category: 'demo' },
  { name: 'CustomViewExamplePage', category: 'demo' },
  { name: 'DBExamplePage', category: 'demo', skip: true },
  { name: 'example', category: 'demo' },
  { name: 'DragItemListDemoPage', category: 'demo', needsInteraction: true },
  { name: 'EventDemoPage', category: 'demo', needsInteraction: true },
  { name: 'capture', category: 'demo', needsInteraction: true },
  { name: 'FlatLayoutBugPage', category: 'demo' },
  { name: 'FontExamplePage', category: 'demo' },
  { name: 'fontWeight', category: 'demo' },
  { name: 'GalleryExamplePage', category: 'demo' },
  { name: 'gif_switch_demo', category: 'demo' },
  { name: 'HelloWorldPage', category: 'demo' },
  { name: 'HotHeapExamplePage', category: 'demo' },
  { name: 'image_demo', category: 'demo' },
  { name: 'image_shared_drawable_demo', category: 'demo' },
  { name: 'input_measure', category: 'demo' },
  { name: 'InputViewDemoPage', category: 'demo', needsInteraction: true },
  { name: 'JobCancelDemoPage', category: 'demo' },
  { name: 'KuiklyPageViewDemo', category: 'demo' },
  { name: 'LiquidGlassDemoPage', category: 'demo' },
  { name: 'ListInitContentOfffsetTestPage', category: 'demo' },
  { name: 'ListViewDemoPage', category: 'demo' },
  { name: 'maxLength', category: 'demo' },
  { name: 'MemoryDumpExamplePage', category: 'demo', skip: true },
  { name: 'ModalViewDemoPage', category: 'demo' },
  { name: 'NetworkExamplePage', category: 'demo', skip: true },
  { name: 'NotifyToHostDemo', category: 'demo' },
  { name: 'OverflowDemoPage', category: 'demo' },
  { name: 'OverNativeClickDemo2', category: 'demo' },
  { name: 'PAGViewDemoPage', category: 'demo' },
  { name: 'PerformancePage', category: 'demo' },
  { name: 'PinchGestureExampleDemo', category: 'demo', needsInteraction: true },
  { name: 'reactive', category: 'demo' },
  { name: 'ReelectionExamplePage', category: 'demo' },
  { name: 'root_demo', category: 'demo' },
  { name: 'root_size', category: 'demo' },
  { name: 'SafeAreaExamplePage', category: 'demo' },
  { name: 'ScreenFrameExamplePage', category: 'demo' },
  { name: 'ScrollViewPage', category: 'demo' },
  { name: 'SkewDemo', category: 'demo' },
  { name: 'SliderExamplePage', category: 'demo', needsInteraction: true },
  { name: 'SliderPageViewDemoPage', category: 'demo' },
  { name: 'SlotMachinePage', category: 'demo', waitTime: 3000 },
  { name: 'SwitchExamplePage', category: 'demo', needsInteraction: true },
  { name: 'TabsExamplePage', category: 'demo' },
  { name: 'TDFModuleExample', category: 'demo' },
  { name: 'nestedHorizontalList', category: 'demo' },
  { name: 'TextViewDemoPage', category: 'demo' },
  { name: 'TimerExamplePage', category: 'demo' },
  { name: 'ToImageExamplePage', category: 'demo' },
  { name: 'TouchEventTestPage', category: 'demo', needsInteraction: true },
  { name: 'VideoExamplePage', category: 'demo', skip: true },
  { name: 'ViewBackgroundImageExamplePage', category: 'demo' },
  { name: 'ViewDemoPage', category: 'demo' },
  { name: 'ViewExtExamplePage', category: 'demo' },
  { name: 'vforlazy', category: 'demo' },
  { name: 'vrefresh', category: 'demo' },
  { name: 'vfor_mod', category: 'demo' },
  { name: 'visibleArea', category: 'demo' },
  { name: 'WaterfallListDemoPage', category: 'demo' },
  { name: 'ExampleIndexPage', category: 'demo' },

  // ==================== Kit DeclarativeDemo 页面 ====================
  { name: 'ActivityIndicatorExamplePage', category: 'kit' },
  { name: 'BlurExamplePage', category: 'kit' },
  { name: 'ButtonExamplePage', category: 'kit' },
  { name: 'FlexExamplePage', category: 'kit' },
  { name: 'HoverExamplePage', category: 'kit' },
  { name: 'ImageExamplePage', category: 'kit' },
  { name: 'LazyListExamplePage', category: 'kit' },
  { name: 'ListExamplePage', category: 'kit' },
  { name: 'TestNewAnimationPage1', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage2', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage3', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage4', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage5', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage6', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage7', category: 'kit', waitTime: 3000 },
  { name: 'TestNewAnimationPage8', category: 'kit', waitTime: 3000 },
  { name: 'PAGExamplePage', category: 'kit' },
  { name: 'PageListExamplePage', category: 'kit' },
  { name: 'AnyRefreshExamplePage', category: 'kit', needsInteraction: true },
  { name: 'ScrollPickerExamplePage', category: 'kit' },
  { name: 'ScrollViewExamplePage', category: 'kit' },
  { name: 'TextExamplePage', category: 'kit' },
  { name: 'TransformExamplePage', category: 'kit' },
  { name: 'ViewExamplePage', category: 'kit' },
  { name: 'ZIndexExamplePage', category: 'kit' },

  // ==================== List 页面 ====================
  { name: 'listOverlap', category: 'list' },
  { name: 'lnest', category: 'list' },
  { name: 'lnestRow', category: 'list' },
  { name: 'lnestno', category: 'list' },
  { name: 'listvv', category: 'list' },
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
