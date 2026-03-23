请执行 KuiklyUI Web E2E 测试（对应 `.codebuddy/rules/kuikly-test.md` 第三节定义的 run 指令）。

参数：$ARGUMENTS

---

根据参数决定运行范围：
- 无参数 → 全量测试（L0 + L1 + L2）
- `--level L0` → 只跑 `tests/L0-static`
- `--level L1` → 只跑 `tests/L1-simple`
- `--level L2` → 只跑 `tests/L2-complex`
- `--full` → 全流程（插桩 → 后台启动插桩服务器 → 测试 → 覆盖率报告）

**执行步骤：**

1. 在 `web-e2e/` 目录执行对应的 `npx playwright test` 命令（Playwright 会自动启动/复用 8080 端口服务器，无需手动操作）
2. 输出结果摘要：通过数量、失败数量、跳过数量，以及失败用例的名称和错误类型
3. 若有失败，简要说明可能原因及建议（如截图对比失败建议运行 `--update-snapshots`）

详细行为规范见 `.codebuddy/rules/kuikly-test.md` 第三节（3.1～3.3）。
