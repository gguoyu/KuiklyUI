请收集并展示 Kuikly Web E2E 覆盖率摘要。

---

**执行步骤：**

1. 检查 `test-e2e-init/.nyc_output/` 是否存在
   - 若不存在或为空，先执行覆盖率收集：
     ```bash
     cd test-e2e-init
     npm run instrument
     node kuikly-web-autotest/scripts/serve-instrumented.mjs &
     npm test
     ```

2. 生成报告：
   ```bash
   cd test-e2e-init && npm run coverage
   ```

3. 检查阈值：
   ```bash
   cd test-e2e-init && npm run coverage:check
   ```

4. 展示 lines / functions / statements / branches 覆盖率数值

详细规范见 `.claude/rules/kuikly-test-rules.md` 第八节。
