请执行 KuiklyUI Web E2E **全自动闭环**流程（对应 `.codebuddy/rules/kuikly-test.md` 第十一节定义的 auto 指令）。

参数：$ARGUMENTS

---

请读取 `.codebuddy/rules/kuikly-test.md` 第十一节（11.1～11.8），然后**完整执行**以下五个 Phase：

**Phase A — 用例完整性检查**
扫描 `demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/` 下所有 `.kt` 页面，对比 `web-e2e/tests/` 下现有 spec 文件，找出缺失的 spec 并自动生成补充（参照第十一节 11.3 步骤）。

**Phase B — 运行全量测试**
在 `web-e2e/` 目录执行 `npx playwright test --reporter=list`，收集所有用例的通过/失败状态（参照第十一节 11.4 步骤）。

**Phase C — 修复失败用例**
将失败用例分类为 SCREENSHOT_DIFF / ELEMENT_NOT_FOUND / ASSERTION_FAILED / PAGE_CRASH，针对每类执行对应修复策略，每个用例最多重试 2 次（参照第十一节 11.5 步骤）。

**Phase D — 覆盖率检查与补充**
插桩 → 后台启动插桩服务器 → 运行全量测试 → 生成覆盖率报告 → 检查阈值。若不达标，分析低覆盖区域并补充用例，最多循环 3 次（参照第十一节 11.6 步骤）。

**Phase E — 输出最终报告**
按第十一节 11.7 定义的格式，输出完整执行报告，包含用例完整性、测试结果、覆盖率数值、变更文件清单、待人工处理项目。

全程自主执行，**无需用户介入**。
