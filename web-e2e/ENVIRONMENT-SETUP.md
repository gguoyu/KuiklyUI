# Kuikly Web E2E 测试环境准备指南

本文档说明如何正确准备测试环境,避免常见的 JavaScript 加载失败问题。

---

## 📋 前置要求

- ✅ Node.js 18.17 或更高版本
- ✅ npm 9.0 或更高版本
- ✅ Java 11 或更高版本（Gradle 需要）
- ✅ Playwright 浏览器（自动安装）

---

## 🚀 完整的三步骤流程

### 步骤说明

测试环境需要 **3 个终端** 同时运行,按以下顺序启动:

```
┌─────────────────────────────────────────────────────┐
│  终端 1: npm run serve                              │
│  ↓ 提供静态文件服务 (index.html)                    │
├─────────────────────────────────────────────────────┤
│  终端 2: ./gradlew :demo:packLocalJSBundleDebug "-Pkuikly.useLocalKsp=false"    │
│          ./gradlew :h5App:jsBrowserDevelopmentRun -t│
│  ↓ 构建并监听 JS Bundle (h5App.js, nativevue2.js)   │
├─────────────────────────────────────────────────────┤
│  终端 3: npm run test:smoke                         │
│  ↓ 运行 Playwright 测试                              │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 详细步骤

### 第一次使用（完整流程）

#### 0. 安装依赖（仅首次需要）

```bash
cd web-e2e
npm install
npx playwright install chromium
```

---

#### 1. 启动测试服务器（终端 1）

```bash
cd web-e2e
npm run serve
```

**期望输出：**
```
🚀 Kuikly Web E2E 测试服务器已启动

   构建类型: productionExecutable
   端口: 8081
   访问地址: http://localhost:8081/
```

**⚠️ 注意：**
- 此终端需要持续运行
- 服务器提供静态 HTML 文件和路由

---

#### 2. 构建 JS Bundle（终端 2）

在项目根目录运行：

```bash
# Step 1: 打包本地调试 Bundle（一次性命令）
./gradlew :demo:packLocalJSBundleDebug "-Pkuikly.useLocalKsp=false"

# Step 2: 启动 h5App 开发构建（持续监听）
./gradlew :h5App:jsBrowserDevelopmentRun -t
```

**期望输出：**
```
> Task :demo:packLocalJSBundleDebug "-Pkuikly.useLocalKsp=false"
BUILD SUCCESSFUL in 10s

> Task :h5App:jsBrowserDevelopmentRun
BUILD SUCCESSFUL in 2m 15s
Watching for changes...
```

**⚠️ 注意：**
- **首次构建需要 5-15 分钟**（下载依赖、编译 Kotlin）
- `-t` 参数开启持续监听,文件变化会自动重新构建
- 此终端需要持续运行
- 构建产物会生成到 `h5App/build/` 目录

**验证构建成功：**
```bash
# 检查关键文件是否生成
ls h5App/build/compileSync/js/main/developmentExecutable/kotlin/*.js
```

---

#### 3. 运行测试（终端 3）

保持前两个终端运行,在新终端执行：

```bash
cd web-e2e

# 运行冒烟测试
npm run test:smoke

# 或运行所有 L0 测试
npm run test:L0

# 或使用 UI 模式（推荐调试时使用）
npm run test:ui
```

**期望输出：**
```
Running 5 tests using 3 workers

  ✓ 应该成功加载 ComposeRoutePager 页面
  ✓ 应该正确注入 data-kuikly-component 属性
  ✓ 应该支持组件选择器定位元素
  ✓ 视觉回归：ComposeRoutePager 页面截图
  ✓ 应该能够获取组件层级结构

  5 passed (12.3s)
```

---

## 🔄 后续使用（快速流程）

如果 JS Bundle 已经构建过,且代码没有变化:

```bash
# 终端 1
cd web-e2e && npm run serve

# 终端 2（如果已有构建产物,可跳过）
# 如果代码有修改,运行:
./gradlew :h5App:jsBrowserDevelopmentRun -t

# 终端 3
cd web-e2e && npm run test:smoke
```

---

## 🐛 常见问题排查

### ❌ 问题 1：页面空白,JavaScript 加载失败

**症状：**
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
http://localhost:8081/h5App.js
```

**原因：**
- h5App.js 未构建
- 或者终端 2 的 Gradle 任务未运行

**解决：**
1. 确认终端 2 已执行 `./gradlew :h5App:jsBrowserDevelopmentRun -t`
2. 等待构建完成（首次较慢）
3. 检查是否有构建错误
4. 刷新浏览器

---

### ❌ 问题 2：nativevue2.js 加载失败

**症状：**
```
GET http://localhost:8081/nativevue2.js 404 (Not Found)
```

**原因：**
- 未执行 `./gradlew :demo:packLocalJSBundleDebug "-Pkuikly.useLocalKsp=false"`

**解决：**
```bash
./gradlew :demo:packLocalJSBundleDebug "-Pkuikly.useLocalKsp=false"
```

---

### ❌ 问题 3：Gradle 构建失败

**症状：**
```
FAILURE: Build failed with an exception.
```

**解决：**
1. 检查 Java 版本：`java -version`（需要 Java 11+）
2. 清理构建缓存：`./gradlew clean`
3. 重新构建：`./gradlew :h5App:jsBrowserDevelopmentRun -t`

---

### ❌ 问题 4：测试超时

**症状：**
```
Test timeout of 30000ms exceeded
```

**原因：**
- 服务器未启动
- 页面加载失败

**解决：**
1. 确认 `npm run serve` 在运行
2. 手动访问 http://localhost:8081/?page_name=crouter
3. 检查浏览器控制台是否有错误

---

## 📊 验证环境正常

在运行测试前,可以手动验证环境:

```bash
# 1. 检查服务器
curl http://localhost:8081/

# 2. 检查测试页面
curl http://localhost:8081/?page_name=crouter

# 3. 检查 h5App.js
ls -lh h5App/build/compileSync/js/main/developmentExecutable/kotlin/h5App.js
```

---

## 🎯 最佳实践

### 开发时

- 保持终端 1 和 2 持续运行
- 修改代码后,终端 2 会自动重新构建
- 终端 3 重新运行测试即可

### CI/CD 时

使用一次性构建命令:

```bash
# 1. 构建
./gradlew :demo:packLocalJSBundleDebug
./gradlew :h5App:jsBrowserProductionWebpack

# 2. 启动服务器（后台）
cd web-e2e && npm run serve &

# 3. 运行测试
cd web-e2e && npm test
```

---

## 📚 相关文档

- [QUICKSTART.md](./QUICKSTART.md) - 快速启动指南
- [README.md](./README.md) - 项目总览
- [VERIFICATION-RESULT.md](./VERIFICATION-RESULT.md) - Phase 1 验证结果

---

**最后更新**: 2026-03-17
