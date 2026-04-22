# KuiklyUI Web E2E 测试说明

本目录（`web-e2e/`）维护了 KuiklyUI Web 渲染层（`core-render-web` + `h5App`）的端到端测试框架，基于 Playwright，通过 Kotlin/JS 编译产物在浏览器中验证组件渲染、样式、交互、动画全流程。

## 快速开始

```bash
cd web-e2e
npm install
npx playwright install chromium

# 标准入口：构建 → 启动服务器 → 测试 → 覆盖率报告 → 阈值检查
node scripts/kuikly-test.mjs --full
```

详细说明见 [QUICKSTART.md](./QUICKSTART.md)。

## 常用命令

```bash
npm test                        # 运行全量测试
npm run test:smoke              # 冒烟测试（约 10s）
npm run test:static             # 确定性断言用例
npm run test:functional         # 交互状态变化用例
npm run test:visual             # 截图结论用例
npm run coverage                # 生成 Kotlin 覆盖率报告
npm run coverage:check          # 阈值检查（Kotlin 行 ≥ 70%）
```

## AI 辅助测试命令

触发 AI 自动闭环（从仓库根目录）：

```bash
node kuikly-web-autotest/scripts/run-autotest-loop.mjs \
  --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan
```

完整的 AI 行为规范见 [../kuikly-web-autotest/SKILL.md](../kuikly-web-autotest/SKILL.md)。

## 测试文档

- [QUICKSTART.md](./QUICKSTART.md) — 快速上手（安装、首次运行、常见问题、AI 闭环）
- [README.md](./README.md) — 完整功能说明（目录结构、API、CLI 参数、编写规范）
- [AUTOTEST.md](./AUTOTEST.md) — 测试方案设计文档（架构、规范、实施计划）
