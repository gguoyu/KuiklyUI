# KuiklyUI 项目说明

KuiklyUI 是一个基于 Kotlin Multiplatform 的跨平台 UI 框架，Web 渲染层（`core-render-web` + `h5App`）通过 Kotlin/JS 编译为浏览器可执行代码。

## Web E2E 测试

本项目在 `web-e2e/` 目录下维护了一套基于 Playwright 的端到端测试框架，用于验证 Web 渲染层的组件渲染、样式、交互、动画全流程。

- **测试总量**：191 用例（188 passed，3 skipped）
- **测试级别**：L0 静态截图 / L1 简单交互（含模块测试）/ L2 复杂交互 + 动画
- **代码覆盖率**：Kotlin 行覆盖率 **57%**（通过 source map 反映射到 `.kt` 文件）
- **测试文档**：`web-e2e/README.md`，`web-e2e/QUICKSTART.md`，`AUTOTEST.md`

## 常用命令

```bash
cd web-e2e
npm test                   # 运行全量测试
npm run test:smoke         # 冒烟测试（约 10s）
npm run test:modules       # 模块测试（Codec/Notify/Calendar/Network 等）
npm run coverage           # JS 文件级覆盖率摘要
npm run coverage:kotlin    # Kotlin 源文件级覆盖率（通过 source map 反映射，推荐）
npm run coverage:check     # 阈值检查（Kotlin 行 ≥ 70%）
```

## AI 辅助测试命令

使用 `/project:kuikly-test` 系列斜杠命令可以让 AI 自动完成测试相关任务：

| 命令 | 说明 |
|------|------|
| `/project:kuikly-test-auto` | 全自动闭环：运行 → 修复 → 覆盖率，直到全部达标 |
| `/project:kuikly-test-run` | 一键运行测试（可加 `--level L0\|L1\|L2`） |
| `/project:kuikly-test-generate` | 根据 Kotlin 测试页面自动生成 spec 文件 |
| `/project:kuikly-test-coverage` | 收集并展示覆盖率摘要 |
| `/project:kuikly-test-guide` | 输出用例编写规范和 Fixture API 参考 |

完整的 AI 行为规范定义在 `.codebuddy/rules/kuikly-test.md`（也是 `.claude/commands/` 各命令文件的内容来源）。
