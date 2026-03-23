请执行 Kuikly Web E2E 测试。

参数：$ARGUMENTS
（支持 `--level L0|L1|L2`，不传则运行全量）

---

**执行步骤：**

1. 进入 e2e 目录：`cd test-e2e-init`

2. 根据参数运行：
   - 无参数：`npm test`
   - `--level L0`：`npm run test:L0`
   - `--level L1`：`npm run test:L1`
   - `--level L2`：`npm run test:L2`

3. 输出结果摘要：通过/失败数量、失败用例名称

详细规范见 `.claude/rules/kuikly-test-rules.md` 第三节。
