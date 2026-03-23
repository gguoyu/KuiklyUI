请执行 Kuikly Web E2E **全自动闭环**流程。

---

按以下 Phase 顺序全程自主执行，无需人工介入：

**Phase A — 用例完整性检查**
1. 扫描 `demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/` 下所有 `.kt` 测试页面
2. 检查每个页面在 `test-e2e-init/tests/` 中是否有对应 spec 文件
3. 缺失则自动补生成（流程同 generate 指令），并运行 `--update-snapshots` 建立截图基准

**Phase B — 运行全量测试**
```bash
cd test-e2e-init && npm test
```
按类型分类失败用例：SCREENSHOT_DIFF / ELEMENT_NOT_FOUND / ASSERTION_FAILED / PAGE_CRASH

**Phase C — 自动修复失败用例**
按 `.claude/rules/kuikly-test-rules.md` 第九节修复策略处理，每个用例最多重试 2 次

**Phase D — 覆盖率检查与补充**
```bash
cd test-e2e-init
npm run instrument
node kuikly-web-autotest/scripts/serve-instrumented.mjs &
npm test
npm run coverage && npm run coverage:check
```
不达标则补充用例，最多循环 3 次

**Phase E — 输出完整报告**
包含：用例完整性、测试结果、覆盖率数值、变更文件、待人工处理项

详细行为规范见 `.claude/rules/kuikly-test-rules.md` 第九节。
