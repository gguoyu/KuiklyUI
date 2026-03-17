# 🚀 Kuikly Web E2E 快速启动指南

## 📋 Phase 1 成果验证

本文档帮助你快速验证 Phase 1 基础设施搭建是否成功。

**💡 首次使用？** 强烈建议先阅读 [环境准备指南 ENVIRONMENT-SETUP.md](./ENVIRONMENT-SETUP.md) 了解详细的三步骤流程和常见问题排查。

---

## 🔧 环境准备

### 1. 安装 E2E 测试依赖

进入 `web-e2e` 目录：

```bash
cd web-e2e

# 安装 npm 依赖
npm install

# 安装 Playwright 浏览器
npm run install:browsers
```

---

## 🧪 运行 L0 冒烟测试

### 步骤 1：启动本地服务器

在 `web-e2e` 目录，打开**第一个终端**：

```bash
npm run serve
```

你应该看到：
```
🚀 Kuikly Web E2E 测试服务器已启动

   构建类型: productionExecutable
   端口: 8081
   访问地址: http://localhost:8081/
```

---

### 步骤 2：构建 JS Bundle（本地调试包）

在项目根目录，打开**第二个终端**：

```bash
# 打包本地调试 Bundle（必须先执行）
./gradlew :demo:packLocalJSBundleDebug
```

这会生成 `nativevue2.js` 等必要的 JS 文件到本地目录。

---

### 步骤 3：启动 h5App 开发构建（持续监听）

保持第二个终端，继续运行：

```bash
# 启动 h5App 开发构建（-t 参数开启持续监听）
./gradlew :h5App:jsBrowserDevelopmentRun -t
```

**⚠️ 重要提示**:
- `-t` 参数会持续监听文件变化并自动重新构建
- 这个命令会持续运行，不要关闭该终端
- 首次构建可能需要 5-15 分钟

**验证构建成功：**
- 第二个终端显示 "BUILD SUCCESSFUL"
- 浏览器访问 http://localhost:8081/ 应该看到 Kuikly H5 应用正常加载
- 检查浏览器控制台没有 JS 加载错误

---

### 步骤 4：运行冒烟测试

保持前两个终端运行，打开**第三个终端**，在 `web-e2e` 目录运行：

```bash
# 运行 L0 冒烟测试
npm run test:smoke

# 或者运行所有 L0 测试
npm run test:L0

# 带 UI 界面运行（推荐，方便调试）
npm run test:ui
```

---

## ✅ 验证成功标准

冒烟测试应该通过以下检查点：

1. **✅ 页面加载成功**
   - `应该成功加载 ComposeRoutePager 页面` - PASSED

2. **✅ data-kuikly-component 属性注入成功**
   - `应该正确注入 data-kuikly-component 属性` - PASSED
   - 终端输出：找到 N 个 Kuikly 组件

3. **✅ 组件选择器工作正常**
   - `应该支持组件选择器定位元素` - PASSED
   - 终端输出：通过 component() 找到 N 个 KRView 组件

4. **✅ 视觉回归测试可用**
   - `视觉回归：ComposeRoutePager 页面截图` - PASSED
   - 首次运行会生成基准截图

5. **✅ 组件层级分析可用**
   - `应该能够获取组件层级结构` - PASSED
   - 终端输出：组件层级结构 JSON

---

## 📊 查看测试报告

测试完成后，查看详细报告：

```bash
npm run report
```

这会打开一个交互式 HTML 报告，包含：
- 每个测试的执行时间
- 失败原因（如有）
- 截图和视频录制
- 追踪日志

---

## 🐛 常见问题排查

### 问题 1：服务器启动失败

**症状：**
```
Error: ENOENT: no such file or directory
```

**解决：**
1. 确认已构建 h5App：`./gradlew :h5App:jsBrowserProductionWebpack`
2. 检查构建产物路径是否存在

---

### 问题 2：测试找不到元素

**症状：**
```
Error: locator.click: Timeout 30000ms exceeded
```

**解决：**
1. 确认服务器在 http://localhost:8081 运行
2. 手动访问该 URL，检查页面是否正常
3. 检查渲染层代码是否正确注入 `data-kuikly-component` 属性

---

### 问题 3：视觉回归测试失败

**症状：**
```
Error: Screenshot comparison failed
```

**解决：**
1. 首次运行：执行 `npm run test:update-snapshots` 生成基准截图
2. 有意改动：检查差异是否符合预期
3. 环境差异：不同操作系统/浏览器可能产生轻微差异（调整 `maxDiffPixels`）

---

### 问题 4：找不到 data-kuikly-component 属性

**症状：**
```
expect(received).toBeGreaterThan(expected)
Expected: > 0
Received: 0
```

**解决：**
1. 确认渲染层代码已修改（KuiklyRenderLayerHandler.kt）
2. 重新构建 h5App
3. 刷新浏览器，检查元素是否有该属性

---

## 🎯 下一步

Phase 1 验证通过后，可以开始：

1. **Phase 2：核心用例覆盖**
   - 编写 L1 交互测试（点击、滚动、输入）
   - 编写 L2 复杂场景测试

2. **Phase 3：CI/CD 集成**
   - 编写 Jenkins/GitHub Actions 配置
   - 设置定时任务和触发规则

3. **Phase 4：覆盖率分析**
   - 集成 Istanbul/NYC
   - 生成覆盖率报告

---

## 📚 更多资源

- **Playwright 官方文档**: https://playwright.dev/
- **Kuikly E2E 完整文档**: 见 `AUTOTEST.md`
- **测试用例模板**: 见 `tests/` 目录

---

## ❓ 获取帮助

如有问题，请联系：
- 项目负责人: [你的名字]
- 问题追踪: [Issue Tracker 链接]
