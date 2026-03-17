# Phase 1 验证清单 ✅

快速验证 Phase 1 实施成果的核心检查点。

---

## ✅ 快速验证（5 分钟）

### 1. 检查文件存在

```bash
# 检查关键文件是否存在
ls web-e2e/fixtures/kuikly-page.ts
ls web-e2e/tests/L0-static/smoke.spec.ts
ls web-e2e/scripts/serve.mjs
ls web-e2e/QUICKSTART.md
```

### 2. 安装依赖

```bash
cd web-e2e
npm install
npm run install:browsers
```

### 3. 构建 H5 应用

```bash
# 回到项目根目录
cd ..
./gradlew :h5App:jsBrowserProductionWebpack
```

### 4. 运行冒烟测试

**终端 1 - 启动服务器**:
```bash
cd web-e2e
npm run serve
```

**终端 2 - 运行测试**:
```bash
cd web-e2e
npm run test:smoke
```

### 5. 验证通过标准

测试输出应显示:
```
✓ 应该成功加载 ComposeRoutePager 页面
✓ 应该正确注入 data-kuikly-component 属性
✓ 应该支持组件选择器定位元素
✓ 视觉回归：ComposeRoutePager 页面截图
✓ 应该能够获取组件层级结构

5 passed
```

---

## 📊 详细验证（可选）

### 检查渲染层改动

1. 打开 `core-render-web/base/src/jsMain/kotlin/com/tencent/kuikly/core/render/web/layer/KuiklyRenderLayerHandler.kt`
2. 查找第 374 行，确认存在:
   ```kotlin
   renderViewHandler.viewExport.ele.setAttribute("data-kuikly-component", viewName)
   ```

### 浏览器手动验证

1. 访问 `http://localhost:8080/`
2. 打开开发者工具 (F12)
3. 检查 DOM 元素是否有 `data-kuikly-component` 属性

### 查看测试报告

```bash
npm run report
```

---

## 🐛 常见问题

### 服务器 404 错误
- 确认已构建 h5App
- 检查 `h5App/build/processedResources/js/main/` 目录存在

### 测试找不到元素
- 确认服务器在 8080 端口运行
- 手动访问确认页面正常加载

### 截图对比失败
- 首次运行: `npm run test:update-snapshots`
- 后续运行会与基准对比

---

详细说明请见: [QUICKSTART.md](./QUICKSTART.md)
