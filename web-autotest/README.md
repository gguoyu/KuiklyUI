# @tencent/kuikly-web-aitest

KuiklyUI Web 端 AI 辅助自动化测试框架。

提供一套基于 Playwright 的 E2E 测试闭环工具链，支持 Kotlin 代码覆盖率采集、AI 辅助 spec 生成与修复、截图回归对比等完整工作流程。

## 安装

```bash
npm install @tencent/kuikly-web-aitest
```

安装后初始化脚手架目录：

```bash
npx kuikly-aitest init
```

## 快速开始

### 环境要求

| 工具 | 要求 |
|------|------|
| Node.js | >= 20.x |
| JDK | 11+（需设置 `JAVA_HOME`） |
| Playwright | 已通过 peer dependency 引入 |

安装 Playwright 浏览器：

```bash
npx playwright install chromium
```

### 初始化消费方项目

```bash
# 在消费方项目根目录执行：
npx kuikly-aitest init
```

这会在当前目录下创建 `web-autotest/` 脚手架，包含：
- `web-autotest/kuikly.autotest.config.cjs` — 项目级配置（需按项目修改路径）
- `web-autotest/playwright.config.js` — Playwright 配置（自动指向包内服务器脚本）
- `web-autotest/tests/` — 测试用例目录
- `.claude/commands/kuikly-web-autotest.md` — Claude Code skill stub

### 修改配置

编辑 `web-autotest/kuikly.autotest.config.cjs`，按消费方项目实际路径修改 `webTestRoot`、`sourceRoots`、`build`、`coverage` 等字段。

### 运行测试

```bash
# 完整闭环（包含 Gradle 编译 + 测试 + 覆盖率）
node node_modules/@tencent/kuikly-web-aitest/scripts/kuikly-test.mjs --full

# 仅运行 Playwright 测试（跳过编译）
node node_modules/@tencent/kuikly-web-aitest/scripts/kuikly-test.mjs --skip-build

# AI 自动化闭环（推荐，含 spec 自动生成与修复）
node node_modules/@tencent/kuikly-web-aitest/scripts/loop/run-autotest-loop.mjs \
  --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan
```

## TypeScript / JavaScript 集成

```typescript
import { test, expect } from '@tencent/kuikly-web-aitest';
import type { KuiklyPage } from '@tencent/kuikly-web-aitest';
```

## Playwright 配置工厂

```javascript
// web-autotest/playwright.config.js（由 npx kuikly-aitest init 自动生成）
const { createPlaywrightConfig } = require('@tencent/kuikly-web-aitest/config/playwright-factory');
module.exports = createPlaywrightConfig({ testDir: './tests' });
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `KUIKLY_PROJECT_ROOT` | 消费方项目根目录 | `process.cwd()` |
| `KUIKLY_AUTOTEST_DIR` | 测试脚手架目录（绝对或相对项目根的路径） | `<projectRoot>/web-autotest` |
| `KUIKLY_AUTOTEST_CONFIG` | 配置文件路径 | `<autotestDir>/kuikly.autotest.config.cjs` |
| `KUIKLY_PORT` | 测试服务器端口 | `8080` |
| `KUIKLY_SKIP_WEBSERVER` | 设为 `true` 时跳过 webServer 启动 | — |

## Claude Code 集成

执行 `npx kuikly-aitest init` 后，会在 `.claude/commands/kuikly-web-autotest.md` 创建一个 skill stub，让 Claude Code 能通过 `/kuikly-web-autotest` 触发完整的测试闭环 AI 技能。

## License

见仓库根目录 LICENSE 文件。
