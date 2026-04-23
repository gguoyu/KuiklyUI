# 🚀 Kuikly Web E2E 快速上手指南

快速跑通第一个测试。详细说明见 [README.md](./README.md)。

---

## 第一步：安装依赖

```bash
cd web-autotest
npm install
npx playwright install chromium
```

---

## 第二步：下载字体（首次，可选）

```bash
npm run setup
```

从 Google Fonts 下载 Noto Sans SC WOFF2 字体，用于统一截图渲染。若网络无法访问可跳过，测试仍可正常运行。

---

## 第三步：运行测试

```bash
# 标准入口：构建 → 启动服务器 → 测试 → 覆盖率报告 → 阈值检查
node scripts/kuikly-test.mjs --full

# 本地调试单轮用例（不生成正式覆盖率报告）
npm test
npm run test:smoke

# 按语义分组运行
npm run test:static      # 确定性断言
npm run test:functional  # 交互状态变化
npm run test:visual      # 截图结论
```

看到 `X passed` 即说明环境正常。

---

## 第四步：查看报告

```bash
npx playwright show-report reports/html
```

---

## 常用操作速查

| 操作 | 命令 |
|------|------|
| UI 调试模式 | `npm run test:ui` |
| 更新截图基准 | `npm run test:update-snapshots` |
| 生成覆盖率报告 | `npm run coverage` |
| 检查覆盖率阈值 | `npm run coverage:check` |

详细说明（截图管理、覆盖率模式、CLI 参数）见 [README.md](./README.md)。

---

## 常见问题

### 截图对比失败

```
Error: Screenshot comparison failed. N pixels (ratio X) are different.
```

1. `npx playwright show-report reports/html` 查看差异图
2. 若是预期内的 UI 变更：`npm run test:update-snapshots` 更新基准后 commit
3. 若是 Bug：修复渲染问题后重新运行

### 找不到元素

```
Error: locator.click: Timeout 30000ms exceeded
```

在浏览器打开 `http://localhost:8080/?page_name=<TestPageName>`，确认页面可以加载且 `data-kuikly-component` 属性已注入。

### Kotlin 覆盖率报告为空

未以 V8 coverage 模式运行测试。使用标准入口：

```bash
node scripts/kuikly-test.mjs --full
```

---

## 用 AI 继续闭环

```bash
# 从仓库根目录触发完整 AI 闭环
node web-autotest/scripts/run-autotest-loop.mjs

# 常用参数组合
node web-autotest/scripts/run-autotest-loop.mjs \
  --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan

# 仅对单个 spec 验证修复
node web-autotest/scripts/kuikly-test.mjs --skip-build --test <spec>
```

### 主要输出文件

`web-autotest/reports/autotest/loop-report.json` 是机器可读的闭环报告，关注以下字段：

| 字段 | 含义 |
|------|------|
| `scan.summary` | 页面/spec 完整性状态 |
| `attempts[*].summary` | 每轮测试和覆盖率结果 |
| `mutations` | 本次自动编辑内容 |
| `warnings` | 阻塞项或需要回滚的信号 |
| `finalStatus` | 最终结论 |

### AI 自动修复范围

- ✅ 为缺失的 `web_test` 页面创建 managed spec
- ✅ 刷新失败的 managed spec（定位器/断言过时）
- ✅ 修复确定性的页面映射（`kuiklyPage.goto()` 重映射）
- ✅ 在有明确模式时添加最小化 `web_test` 页面
- ❌ 不重写 handwritten 非 managed spec（仅限上述确定性修复规则）

### 需要人工介入的场景

- spec 目标为 `orphanSpecTarget`（页面不在 `web_test` 下）
- 产品行为存在歧义，无法判断是预期变更还是回归
- 页面被外部 SDK 或产品能力阻塞
- 低覆盖率文件没有合适的 `web_test` 载体页
- 某页面已有 handwritten spec 且全部为 skipped/pending 状态（视为阻塞项）
- 新 `web_test` 页面仅能是占位标题页而不能真正验证缺失能力

---

## 更多资料

- [README.md](./README.md) — 完整功能说明（目录结构、API、CLI 参数、编写规范）
- [AUTOTEST.md](./AUTOTEST.md) — 测试方案设计文档
- [../web-autotest/SKILL.md](../web-autotest/SKILL.md) — AI 闭环完整规范
