# npm 发布路线图：@tencent/kuikly-web-aitest

Phase 1（源码层面改造 + KuiklyUI 自身验证）已完成，commit `e1fed2c6`。
Phase 2（TypeScript 构建产物）已完成。

---

## Phase 2：TypeScript 构建产物

`index.ts` 目前只是源码，`package.json` 的 `main`/`exports` 指向的是 `index.js` + `index.d.ts`，这两个文件还不存在。

- [x] 新增 `tsconfig.build.json`（declaration only，不打包 fixtures 的运行时依赖）
- [x] 在 `package.json` 中添加 `"build": "tsc -p tsconfig.build.json"` 脚本
- [x] 在 `package.json` 中添加 `"prepublishOnly": "npm run build"`，确保发布前自动构建
- [x] 验证 `index.js` 和 `index.d.ts` 产物内容正确

---

## Phase 3：消费方适配（最复杂，关键路径）

有两个文件在 npm 模式下路径假设会失效：

### 3-a：`scripts/serve.cjs`

当前写法：
```js
const PROJECT_ROOT = path.join(__dirname, '..', '..');
```
在 npm 模式下上溯两级会到 `node_modules/@tencent/`，而不是消费方项目根。

- [ ] 改为从 `process.cwd()` 或环境变量推导 `PROJECT_ROOT`
- [ ] 同步排查 `serve.cjs` 中所有依赖 `PROJECT_ROOT` 的路径（BUILD_DIR、DIST_DIR、WEBPACK_DIR 等）
- [ ] 确认消费方能通过 `node node_modules/@tencent/kuikly-web-aitest/scripts/serve.cjs` 正常启动测试服务器

### 3-b：`playwright.config.js`

当前是 KuiklyUI 专用的硬编码配置，消费方无法直接复用。

- [ ] 改造为工厂函数，新增 `config/playwright-factory.cjs`：
  ```js
  function createPlaywrightConfig(overrides) { ... }
  module.exports = { createPlaywrightConfig };
  ```
- [ ] 消费方用法：
  ```js
  // web-autotest/playwright.config.js（由 kuikly-aitest init 生成）
  const { createPlaywrightConfig } = require('@tencent/kuikly-web-aitest/config/playwright-factory');
  module.exports = createPlaywrightConfig({ testDir: './tests' });
  ```
- [ ] 将工厂函数路径添加到 `package.json` 的 `exports` 字段

### 3-c：其他脚本排查

- [ ] 全量扫描 `scripts/` 下是否还有硬编码 `web-autotest/` 或 `__dirname` 相对路径问题
- [ ] 重点检查：`kuikly-test.mjs`、`coverage-report.mjs`、`setup-fonts.mjs`

---

## Phase 4：SKILL.md 更新

消费方通过 stub delegation 读到的 SKILL.md，以下路径全部失效（实际在 node_modules 里）：

| 失效路径 | 实际位置 |
|----------|----------|
| `web-autotest/scripts/...` | `node_modules/@tencent/kuikly-web-aitest/scripts/` |
| `web-autotest/rules/...` | `node_modules/@tencent/kuikly-web-aitest/rules/` |
| `web-autotest/references/...` | `node_modules/@tencent/kuikly-web-aitest/references/` |
| `web-autotest/experience/...` | `node_modules/@tencent/kuikly-web-aitest/experience/` |

- [ ] 将所有 `node web-autotest/scripts/loop/run-autotest-loop.mjs` 等命令改为消费方友好形式
  - 方案 A：通过 npm scripts 封装（消费方在自己的 `package.json` 里配置）
  - 方案 B：通过 `npx kuikly-aitest <subcommand>` 封装（需扩展 CLI）
  - 方案 C：保留绝对路径写法 `node node_modules/@tencent/kuikly-web-aitest/scripts/...`
- [ ] 更新 `references/`、`rules/`、`experience/` 等引用路径
- [ ] 可与 Phase 3 并行进行

---

## Phase 5：npm 发布配置

- [ ] 配置 registry：在 `package.json` 中添加 `"publishConfig": { "registry": "<内部源或 npmjs>" }`
- [ ] 执行 `npm pack --dry-run` 验证 `files` 字段打包结果：
  - 应包含：`bin/`、`config/`、`fixtures/`、`scripts/`、`rules/`、`references/`、`index.js`、`index.d.ts`、`kuikly.autotest.config.cjs`
  - 不应包含：`tests/`（KuiklyUI 自身用例）、`reports/`、`node_modules/`、`*.log`
- [ ] 确认版本管理策略（手动 bump + CHANGELOG，或 semantic-release）
- [ ] 确认 `README.md` 和 `LICENSE` 存在（npm 发布推荐包含）

---

## Phase 6：消费方集成验证（最终验收）

在一个真实的消费方项目里走通完整流程：

- [ ] `npm install @tencent/kuikly-web-aitest`
- [ ] `npx kuikly-aitest init` 生成脚手架目录结构
- [ ] 配置 `web-autotest/kuikly.autotest.config.cjs` 指向消费方的 `webTestRoot` 等路径
- [ ] 写一个最小 spec，验证以下 import 能正常工作：
  ```ts
  import { test, expect } from '@tencent/kuikly-web-aitest';
  ```
- [ ] 验证测试服务器能正常启动：`node node_modules/@tencent/kuikly-web-aitest/scripts/serve.cjs`
- [ ] 跑通 loop 脚本一个完整 round

---

## 阶段依赖关系

```
Phase 1 ✅ 完成
    ↓
Phase 2（构建产物）
    ↓
Phase 3（消费方适配）←──┐
    ↓                   │ 可并行
Phase 4（SKILL.md）─────┘
    ↓
Phase 5（发布配置）
    ↓
Phase 6（集成验证）
```

Phase 3 是工作量最大的阶段，`serve.cjs` 的 `PROJECT_ROOT` 问题会影响测试服务器能否在消费方项目里正常启动，是整个发布流程的关键路径。
