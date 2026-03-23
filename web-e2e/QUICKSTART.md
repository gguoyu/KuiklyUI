# 🚀 Kuikly Web E2E 快速上手指南

5 分钟跑通第一个测试。

---

## 第一步：安装依赖

```bash
cd web-e2e
npm install
npx playwright install chromium
```

---

## 第二步：运行测试

Playwright 会**自动启动**本地服务器（端口 8080），无需手动操作。

```bash
# 冒烟测试（最快，约 10s）
npm run test:smoke

# 全量测试
npm test

# 指定级别
npm run test:L0    # L0 静态渲染截图（72 tests）
npm run test:L1    # L1 简单交互（15 tests）
npm run test:L2    # L2 复杂交互 + 动画（70 tests）
```

看到 `X passed` 即说明环境正常。

---

## 第三步：查看报告

```bash
npx playwright show-report reports/html
```

会在浏览器打开交互式报告，包含每个用例的截图、视频、错误详情。

---

## 常用操作速查

### 调试某个测试

```bash
# 有界面运行，可以看到浏览器操作过程
npx playwright test tests/L1-simple/click.spec.ts --headed

# Playwright UI 模式（推荐，可单步执行、时间旅行）
npm run test:ui

# 单步调试
npx playwright test tests/L1-simple/click.spec.ts --debug
```

### 截图基准管理

截图基准存储在各 spec 文件同级的 `*.spec.ts-snapshots/` 目录下。

```bash
# 更新全部截图基准（改动 UI 后需要执行）
npx playwright test --update-snapshots

# 只更新某个文件的基准
npx playwright test tests/L0-static/components/krview.spec.ts --update-snapshots
```

> ⚠️ 更新基准前务必肉眼确认截图变化符合预期，再 commit。

---

### 截图对比与平台一致性（Docker 模式）

**核心问题：** 截图在不同操作系统（Windows/Mac/Linux）因字体渲染、抗锯齿差异，会产生像素级不同。如果直接用 `npm test` 在 Windows/Mac 本地跑，截图可能和 CI（Linux）生成的基准对不上，出现误报。

**两种本地运行模式的区别：**

| 命令 | 适用场景 | 截图对比是否权威 |
|------|----------|-----------------|
| `npm test` | 开发调试、快速验证逻辑 | ❌ 可能因平台差异误报截图 diff |
| `npm run docker:test` | 提交前最终验证 / CI 等价 | ✅ 与 CI 完全一致 |

**首次使用 Docker 模式（需要先安装 Docker Desktop）：**

```bash
# 构建镜像（首次或 Playwright 版本升级后执行一次）
npm run docker:build

# 在容器内运行测试（与 CI 结果完全等价）
npm run docker:test
```

**更新基准截图的正确姿势：**

```bash
# 1. 在容器内生成截图，结果自动写回宿主机
npm run docker:update-snapshots

# 2. 肉眼 review 截图变化
git diff tests/

# 3. 确认无误后提交
git add tests/ && git commit -m "chore: update snapshots"
```

> ⚠️ **不要**用 `npm test -- --update-snapshots`（本地直接运行）更新截图，
> 否则生成的基准是宿主机平台的截图，CI 上比对时会持续误报。

### 覆盖率模式

覆盖率收集已集成在 fixture 中，**无需两个终端**。只需后台启动插桩服务器，再运行测试即可：

```bash
# 插桩 + 后台启动插桩服务器
npm run instrument
node scripts/serve-instrumented.mjs &

# 运行测试并收集覆盖率数据（自动写入 .nyc_output/）
npm test
npm run coverage          # 生成报告（reports/coverage/index.html）
npm run coverage:check    # 检查是否达到阈值（lines/functions/statements ≥ 70%，branches ≥ 55%）
```

### 使用 CLI 统一入口

```bash
# 跳过构建，只跑 L1 测试
node scripts/kuikly-test.mjs --level L1 --skip-build

# 全流程（构建 → 插桩 → 测试 → 覆盖率）
node scripts/kuikly-test.mjs --full

# 仅生成覆盖率报告（基于已有 .nyc_output 数据）
node scripts/kuikly-test.mjs --coverage-only
```

### 用 AI 生成新测试用例

```bash
# 分析测试页面源码，自动生成对应 spec 文件
@skill kuikly-test generate KRListViewTestPage

# 生成后，运行并生成初始截图基准
npx playwright test tests/L0-static/components/krlist.spec.ts --update-snapshots
```

---

## 常见问题

### 测试失败：截图对比不通过

```
Error: Screenshot comparison failed
N pixels (ratio X) are different.
```

**原因 1：页面渲染结果与截图基准不一致（真正的 UI 变更或 Bug）。**

处理：
1. 先用 `npx playwright show-report reports/html` 查看差异图
2. 若是预期内的 UI 变更，用 `npm run docker:update-snapshots` 更新基准后 commit
3. 若是 Bug，修复渲染问题后再次运行

**原因 2：在 Windows/Mac 本地直接跑 `npm test`，与 Linux CI 环境存在字体渲染差异。**

处理：改用 Docker 模式运行，消除平台差异：
```bash
npm run docker:test
```

---

### 测试失败：找不到元素

```
Error: locator.click: Timeout 30000ms exceeded
```

**原因**：服务器未响应，或页面中组件未正确渲染。

**处理**：
1. 手动访问 `http://localhost:8080/?page_name=<TestPageName>` 确认页面可以加载
2. 打开浏览器控制台，检查是否有 JS 错误
3. 确认 `data-kuikly-component` 属性已注入（右键 → 检查元素）

---

### 运行报错：找不到截图基准

```
Error: A snapshot doesn't exist at ...
```

**原因**：首次运行，还没有生成截图基准。

**处理**：
```bash
npx playwright test --update-snapshots
```

---

### 覆盖率报告为空 / 没有数据

**原因**：未使用插桩版服务器运行测试，`window.__coverage__` 不存在，fixture 静默跳过了收集。

**处理**：确保按顺序执行：
```bash
npm run instrument
node scripts/serve-instrumented.mjs &   # 后台启动，无需另开终端
npm test
npm run coverage
```

---

## 运行环境说明

| 参数 | 值 |
|------|----|
| 浏览器 | Chromium |
| Viewport | 375 × 812（iPhone X） |
| 服务器端口 | 8080 |
| 用例超时 | 60s |
| 失败重试 | 本地 1 次，CI 2 次 |

> ⚠️ 截图基准与 viewport 尺寸强绑定，请勿修改 `playwright.config.js` 中的 viewport 配置。

---

## 更多资料

- [README.md](./README.md) — 完整功能说明（目录结构、API、CLI 参数等）
- [../AUTOTEST.md](../AUTOTEST.md) — 测试方案设计文档
- [../.codebuddy/rules/kuikly-test.md](../.codebuddy/rules/kuikly-test.md) — CodeBuddy Skill 定义
- [Playwright 文档](https://playwright.dev)
