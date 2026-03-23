请为指定的 KuiklyUI 测试页面自动生成 Playwright spec 文件（对应 `.codebuddy/rules/kuikly-test.md` 第四节定义的 generate 指令）。

参数：$ARGUMENTS
（参数即 TestPageName，例如：`KRListViewTestPage`、`SearchTestPage`）

---

**执行步骤：**

1. **读取测试页面源码**
   路径：`demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/**/<TestPageName>.kt`

2. **识别页面中的 Compose 组件**，通过第五节映射表推断 DOM 中的渲染组件（`data-kuikly-component`）

3. **查询组件交互特征知识库**（`.codebuddy/rules/kuikly-test.md` 第五节），确定每个渲染组件**必须验证**的交互操作

4. **确定测试级别和输出路径**（取最高级别：L2 > L1 > L0）

5. **生成完整 `.spec.ts` 文件**，严格遵循第六节用例编写规范：
   - 每个操作步骤：定位 → 操作 → 等待渲染 → 截图/断言
   - 使用正确的 `test-base` 导入路径（参照 6.3 路径规则表）
   - 不可遗漏任何组件必须验证的交互

6. **输出文件**，并提示：
   ```bash
   npx playwright test <生成的spec路径> --update-snapshots
   ```

详细行为规范见 `.codebuddy/rules/kuikly-test.md` 第四节（4.1～4.3）和第五节（5.1～5.3）。
