请收集并展示 KuiklyUI Web E2E 覆盖率摘要（对应 `.codebuddy/rules/kuikly-test.md` 第九节定义的 coverage 指令）。

---

**执行步骤：**

1. **检查 `web-e2e/.nyc_output/` 目录**：
   - 若**不存在或为空**，说明尚未以插桩模式运行过测试，自动执行以下步骤收集数据：
     ```bash
     cd web-e2e
     npm run instrument
     node scripts/serve-instrumented.mjs &
     # 等待服务器就绪后
     npm test
     ```
   - 若已有数据，直接生成报告

2. **生成覆盖率报告**：
   ```bash
   cd web-e2e && npm run coverage
   ```

3. **检查阈值**：
   ```bash
   cd web-e2e && npm run coverage:check
   ```

4. **展示摘要**，格式如下：
   ```
   【覆盖率摘要】
   Statements : XX%  （阈值 ≥70%）✅/❌
   Branches   : XX%  （阈值 ≥55%）✅/❌
   Functions  : XX%  （阈值 ≥70%）✅/❌
   Lines      : XX%  （阈值 ≥70%）✅/❌
   报告路径：web-e2e/reports/coverage/index.html
   ```

详细行为规范见 `.codebuddy/rules/kuikly-test.md` 第九节（9.1～9.3）。
