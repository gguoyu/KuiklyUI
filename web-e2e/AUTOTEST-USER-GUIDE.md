# Kuikly Web Autotest User Guide

1. 触发入口

从仓库根目录让 AI 执行：`node kuikly-web-autotest/scripts/run-autotest-loop.mjs`。
这是当前仓库唯一推荐的闭环入口，AI 不应自行拼装测试、覆盖率、分析步骤。

2. 最常用输入

常用参数只有这几类：`--skip-build`、`--max-rounds 3`、`--max-new-specs 20`、`--allow-incomplete-scan`。
如果只是继续上一次闭环，通常输入：`node kuikly-web-autotest/scripts/run-autotest-loop.mjs --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan`。

3. AI 该怎么触发

直接对 AI 说“跑一遍闭环”或“继续 autotest 闭环”，并补充是否要 `--skip-build`、是否允许不完整扫描、是否限制轮数。
如果只想验证单个用例，输入应改成：`node web-e2e/scripts/kuikly-test.mjs --skip-build --test <spec>`。

4. 闭环会自动做什么

它会先扫描 `demo/.../pages/web_test` 和 `web-e2e/tests` 的对应关系，再跑 canonical full test，再分析 Playwright 失败、汇总 Kotlin 覆盖率，并在安全范围内自动补或刷新 `auto-*.spec.ts`。
如果某一轮产生了自动修复，它会继续下一轮；如果没有新修复可做，就停止。

5. 你真正需要看的输出

主输出文件是 `web-e2e/reports/autotest/loop-report.json`。
这里面要重点看四类字段：`scan.summary`、`attempts[*].summary`、`mutations`、`finalStatus`。

6. 输出代表什么

`scan.summary` 告诉你 completeness 是否通过；`attempts[*].summary` 告诉你每一轮测试和覆盖率是否通过；`mutations` 告诉你 AI 自动改了哪些 managed spec；`finalStatus` 是最终结论。
如果 `testsPassed=true` 但 `coveragePassed=false`，说明功能测试已稳定，剩余问题只在覆盖率。

7. AI 允许自动改的范围

AI 只应该自动修改 managed spec、确定性的手写 goto 映射修复，以及少量明确的测试断言修复。
它不应该随意改业务代码，不应该静默放宽有意义的断言，也不应该自动处理含义不清的产品行为变化。

8. 边界和需要人工介入的情况

出现这几类情况时应人工判断：`orphanSpecTarget`、页面行为是否是产品回归、低覆盖文件没有合适的 `web_test` 承载页、或要接入新的外部依赖能力。
像 `PAGAnimTestPage` 这种 completeness 问题，可以先补最小 `web_test` 页消警告；但真正的 PAG 能力验证仍然需要后续人工实现。

9. 建议使用顺序

先跑闭环；如果失败，先看 `loop-report.json`；如果只是单点失败，先用 `--test <spec>` 定向修；定向通过后再回到闭环；直到 `testsPassed=true`、`coveragePassed=true`，或者只剩明确的人工边界问题。
