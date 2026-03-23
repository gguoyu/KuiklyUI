请输出 KuiklyUI Web E2E 用例编写规范和 Fixture API 完整参考（对应 `.codebuddy/rules/kuikly-test.md` 第十节定义的 guide 指令）。

---

请读取 `.codebuddy/rules/kuikly-test.md`，然后完整输出以下内容供用户参考：

1. **第六节：用例编写规范**（6.1 文件命名约定 / 6.2 标准用例结构模板 / 6.3 test-base 导入路径规则 / 6.4 截图对比参数规范）

2. **第七节：KuiklyPage Fixture API**（所有可用方法及示例）

3. **第八节：常见问题 FAQ**

4. **快速参考**：
   - 运行测试：`cd web-e2e && npm test`
   - 更新截图基准：`npx playwright test --update-snapshots`
   - 查看 Playwright 报告：`npx playwright show-report reports/html`
   - 覆盖率收集：`npm run instrument && node scripts/serve-instrumented.mjs & && npm test && npm run coverage`
