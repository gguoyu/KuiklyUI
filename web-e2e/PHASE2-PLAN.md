# Phase 2: web-test 测试页面生成

> **当前状态**: Phase 1 ✅ 完成  
> **下一步**: Phase 2 - 生成专用测试页面  
> **预计时间**: 3 天

---

## 📋 Phase 2 总览

### 目标
在 `demo` 模块中创建专用的 `web_test` 测试页面，为后续的自动化测试提供稳定、可控的测试目标。

### 为什么需要专用测试页面？

现有 Demo 页面的问题：
- ❌ 页面杂乱，命名不统一
- ❌ 覆盖不全，部分组件没有对应页面
- ❌ 不可控，可能随业务需求变更
- ❌ 难以定位，多个组件混在一起

web-test 测试页面的优势：
- ✅ 单一职责，每个页面只验证一个组件/样式
- ✅ 内容确定，使用硬编码数据
- ✅ 布局稳定，确保截图基准长期有效
- ✅ 命名规范，统一使用 `{组件名}TestPage`
- ✅ 完整覆盖，每个组件的所有变体

---

## 📁 目录结构

```
demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/
├── components/                    # 渲染组件测试页面
│   ├── KRViewTestPage.kt
│   ├── KRTextViewTestPage.kt
│   ├── KRImageViewTestPage.kt
│   ├── KRListViewTestPage.kt
│   └── ...
├── styles/                        # CSS 样式测试页面
│   ├── BorderTestPage.kt
│   ├── ShadowTestPage.kt
│   ├── GradientTestPage.kt
│   └── ...
├── interactions/                   # 交互行为测试页面
│   ├── ClickTestPage.kt
│   ├── InputTestPage.kt
│   ├── ListScrollTestPage.kt
│   └── ...
├── animations/                     # 动画测试页面
│   ├── CSSTransitionTestPage.kt
│   └── ...
└── composite/                      # 组合场景测试页面
    ├── SearchTestPage.kt
    └── FormTestPage.kt
```

---

## 🎯 优先级排序

### P0 - 基础渲染组件（必须先实现）

| 测试页面 | 验证目标 | 页面内容 | E2E 测试 |
|---------|---------|---------|---------|
| `KRViewTestPage` | KRView 基础渲染 | 不同尺寸/背景色/圆角的 View | `L0-static/components/krview.spec.ts` |
| `KRTextViewTestPage` | 文本渲染 | 不同字号/颜色/对齐/多行/截断 | `L0-static/components/krtext.spec.ts` |
| `KRImageViewTestPage` | 图片渲染 | 不同尺寸/缩放模式/圆角 | `L0-static/components/krimage.spec.ts` |
| `KRListViewTestPage` | 列表渲染（静态） | 固定数据列表，不滚动 | `L0-static/components/krlist.spec.ts` |

**原因**: 这些是最基础的渲染组件，几乎所有页面都会用到。

---

### P1 - CSS 样式（其次实现）

| 测试页面 | 验证目标 | 页面内容 | E2E 测试 |
|---------|---------|---------|---------|
| `BorderTestPage` | border/borderRadius | 不同宽度/颜色/圆角组合 | `L0-static/styles/border.spec.ts` |
| `ShadowTestPage` | shadow | 不同偏移/模糊/颜色的阴影 | `L0-static/styles/shadow.spec.ts` |
| `GradientTestPage` | gradient | 线性/径向渐变 | `L0-static/styles/gradient.spec.ts` |
| `OpacityTestPage` | opacity | 不同透明度 | `L0-static/styles/opacity.spec.ts` |

**原因**: CSS 样式验证是视觉回归测试的核心。

---

### P2 - 简单交互（第三步）

| 测试页面 | 验证目标 | 页面内容 | E2E 测试 |
|---------|---------|---------|---------|
| `ClickTestPage` | 点击事件 | 按钮+Tab切换+开关 | `L1-simple/click.spec.ts` |
| `InputTestPage` | 输入交互 | 文本输入框+密码框 | `L1-simple/input.spec.ts` |

**原因**: 验证基础交互功能正常工作。

---

### P3 - 复杂交互（最后实现）

| 测试页面 | 验证目标 | 页面内容 | E2E 测试 |
|---------|---------|---------|---------|
| `ListScrollTestPage` | 列表滚动 | 固定50项列表 + 滚动 | `L2-complex/scroll.spec.ts` |
| `NavigationTestPage` | 页面跳转 | 跳转触发+目标页+返回 | `L2-complex/navigation.spec.ts` |

**原因**: 复杂交互依赖基础功能完善。

---

## 🛠️ 实施步骤

### Step 1: 创建目录结构

```bash
# 在 demo 模块中创建 web_test 目录
mkdir -p demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/components
mkdir -p demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/styles
mkdir -p demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/interactions
mkdir -p demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/animations
mkdir -p demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/composite
```

---

### Step 2: 生成 P0 测试页面

#### 2.1 KRViewTestPage

**文件**: `demo/src/.../web_test/components/KRViewTestPage.kt`

**页面内容**:
```kotlin
@Composable
fun KRViewTestPage() {
    Column(
        modifier = Modifier.fillMaxSize().background(Color.White)
    ) {
        // 不同尺寸的 View
        KRView(modifier = Modifier.size(100.dp, 50.dp).background(Color.Red))
        Spacer(modifier = Modifier.height(10.dp))
        
        // 不同背景色的 View
        KRView(modifier = Modifier.size(100.dp, 50.dp).background(Color.Blue))
        Spacer(modifier = Modifier.height(10.dp))
        
        // 不同圆角的 View
        KRView(modifier = Modifier.size(100.dp, 50.dp)
            .background(Color.Green, shape = RoundedCornerShape(10.dp)))
        Spacer(modifier = Modifier.height(10.dp))
        
        // 边框 + 圆角
        KRView(modifier = Modifier.size(100.dp, 50.dp)
            .border(2.dp, Color.Black, shape = RoundedCornerShape(10.dp)))
    }
}
```

**路由注册**:
```kotlin
// 在 Demo 路由中添加
"KRViewTestPage" to { KRViewTestPage() }
```

**访问方式**:
```
http://localhost:8080?page_name=KRViewTestPage
```

---

#### 2.2 KRTextViewTestPage

**页面内容**:
```kotlin
@Composable
fun KRTextViewTestPage() {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp).background(Color.White)
    ) {
        // 不同字号
        KRText("字号 12sp", fontSize = 12.sp)
        KRText("字号 16sp", fontSize = 16.sp)
        KRText("字号 20sp", fontSize = 20.sp)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 不同颜色
        KRText("红色文本", color = Color.Red)
        KRText("蓝色文本", color = Color.Blue)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 不同对齐
        KRText("左对齐", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Start)
        KRText("居中", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        KRText("右对齐", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.End)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 多行文本
        KRText(
            "这是一段很长的多行文本，用于测试文本换行和行高渲染是否正确...",
            modifier = Modifier.width(200.dp),
            maxLines = 3
        )
    }
}
```

---

#### 2.3 KRImageViewTestPage

**页面内容**:
```kotlin
@Composable
fun KRImageViewTestPage() {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp).background(Color.White)
    ) {
        // 固定尺寸图片
        KRImage(
            url = "https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png",
            modifier = Modifier.size(200.dp, 200.dp),
            contentScale = ContentScale.Fit
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 圆角图片
        KRImage(
            url = "https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png",
            modifier = Modifier.size(100.dp, 100.dp).clip(RoundedCornerShape(10.dp)),
            contentScale = ContentScale.Crop
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // 圆形图片
        KRImage(
            url = "https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png",
            modifier = Modifier.size(80.dp, 80.dp).clip(CircleShape),
            contentScale = ContentScale.Crop
        )
    }
}
```

---

#### 2.4 KRListViewTestPage

**页面内容**:
```kotlin
@Composable
fun KRListViewTestPage() {
    // 静态列表，不滚动
    Column(
        modifier = Modifier.fillMaxSize().background(Color.White)
    ) {
        KRText("静态列表（前5项）", modifier = Modifier.padding(16.dp))
        
        repeat(5) { index ->
            Row(
                modifier = Modifier.fillMaxWidth().height(60.dp)
                    .border(1.dp, Color.Gray)
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                KRText("列表项 ${index + 1}", fontSize = 16.sp)
            }
        }
    }
}
```

---

### Step 3: 生成对应的 E2E 测试

#### 3.1 KRView 测试

**文件**: `web-e2e/tests/L0-static/components/krview.spec.ts`

```typescript
import { test, expect } from '../../../fixtures/test-base';

test.describe('KRView 渲染测试', () => {
  test('应该正确渲染不同样式的 KRView', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    
    // 验证所有 KRView 都被渲染
    const views = await kuiklyPage.components('KRView');
    expect(views.length).toBeGreaterThan(0);
    
    // 截图对比
    await expect(kuiklyPage.page).toHaveScreenshot('krview-test.png');
  });
});
```

---

#### 3.2 KRTextView 测试

**文件**: `web-e2e/tests/L0-static/components/krtext.spec.ts`

```typescript
import { test, expect } from '../../../fixtures/test-base';

test.describe('KRTextView 渲染测试', () => {
  test('应该正确渲染不同样式的文本', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRTextViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    
    // 验证文本内容
    await expect(kuiklyPage.page.locator('text=字号 12sp')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=红色文本')).toBeVisible();
    
    // 截图对比
    await expect(kuiklyPage.page).toHaveScreenshot('krtext-test.png');
  });
});
```

---

#### 3.3 KRImageView 测试

**文件**: `web-e2e/tests/L0-static/components/krimage.spec.ts`

```typescript
import { test, expect } from '../../../fixtures/test-base';

test.describe('KRImageView 渲染测试', () => {
  test('应该正确加载和渲染图片', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRImageViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    
    // 等待图片加载完成
    await kuiklyPage.page.waitForLoadState('networkidle');
    await kuiklyPage.page.waitForTimeout(1000); // 额外等待确保图片渲染完成
    
    // 验证图片元素存在
    const images = await kuiklyPage.components('KRImageView');
    expect(images.length).toBe(3);
    
    // 截图对比
    await expect(kuiklyPage.page).toHaveScreenshot('krimage-test.png', {
      maxDiffPixels: 200, // 图片加载可能有轻微差异
    });
  });
});
```

---

#### 3.4 KRListView 测试

**文件**: `web-e2e/tests/L0-static/components/krlist.spec.ts`

```typescript
import { test, expect } from '../../../fixtures/test-base';

test.describe('KRListView 静态渲染测试', () => {
  test('应该正确渲染静态列表', async ({ kuiklyPage }) => {
    await kuiklyPage.goto('KRListViewTestPage');
    await kuiklyPage.waitForRenderComplete();
    
    // 验证列表项数量
    await expect(kuiklyPage.page.locator('text=列表项 1')).toBeVisible();
    await expect(kuiklyPage.page.locator('text=列表项 5')).toBeVisible();
    
    // 截图对比
    await expect(kuiklyPage.page).toHaveScreenshot('krlist-static.png');
  });
});
```

---

### Step 4: 运行测试验证

```bash
# 1. 构建 demo（包含新的测试页面）
./gradlew :demo:packLocalJSBundleDebug "-Pkuikly.useLocalKsp=false"

# 2. 构建 h5App
./gradlew :h5App:jsBrowserDevelopmentWebpack

# 3. 运行新的测试
cd web-e2e
npx playwright test tests/L0-static/components/ --update-snapshots

# 4. 查看测试报告
npx playwright show-report reports/html
```

---

## ✅ 完成标准

Phase 2 完成的标准：
- [ ] P0 测试页面全部创建（4个）
- [ ] P0 E2E 测试全部编写（4个）
- [ ] 所有 P0 测试通过
- [ ] 截图基准已生成
- [ ] 路由注册完成
- [ ] 可以通过 URL 直接访问每个测试页面

---

## 📊 预期输出

完成 Phase 2 后，应该有：

### 代码文件
```
demo/src/.../web_test/
├── components/
│   ├── KRViewTestPage.kt         ✅
│   ├── KRTextViewTestPage.kt     ✅
│   ├── KRImageViewTestPage.kt    ✅
│   └── KRListViewTestPage.kt     ✅
```

### 测试文件
```
web-e2e/tests/L0-static/components/
├── krview.spec.ts      ✅
├── krtext.spec.ts      ✅
├── krimage.spec.ts     ✅
└── krlist.spec.ts      ✅
```

### 截图基准
```
web-e2e/tests/L0-static/components/
├── krview.spec.ts-snapshots/
│   └── krview-test-chromium-win32.png
├── krtext.spec.ts-snapshots/
│   └── krtext-test-chromium-win32.png
├── krimage.spec.ts-snapshots/
│   └── krimage-test-chromium-win32.png
└── krlist.spec.ts-snapshots/
    └── krlist-static-chromium-win32.png
```

### 测试报告
- 11 个测试全部通过（7 + 4）
- 覆盖率报告（待 Phase 6）

---

## 🎯 下一步

完成 Phase 2 后，继续进入：
- **Phase 3**: 完善 P1 样式测试页面
- **Phase 4**: 实现 P2 简单交互测试
- **Phase 5**: 实现 P3 复杂交互测试

---

## 💡 提示

1. **测试页面设计原则**:
   - 单一职责：每个页面只测试一个组件
   - 硬编码数据：不依赖网络请求
   - 布局稳定：确保截图可重复

2. **命名规范**:
   - 测试页面：`{组件名}TestPage.kt`
   - E2E 测试：`{组件名小写}.spec.ts`
   - 截图文件：`{组件名小写}-test.png`

3. **组件定位**:
   - 优先使用 `data-kuikly-component` 定位
   - 使用 `components()` 获取数组
   - 使用 `component()` 进行链式调用

---

**开始 Phase 2 开发吧！** 🚀
