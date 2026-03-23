请为指定的 Kuikly Web 测试页面自动生成 Playwright spec 文件。

参数：$ARGUMENTS
（参数即 TestPageName，例如：`KRListViewTestPage`）

---

**执行步骤：**

1. **读取测试页面源码**
   路径：`demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/**/<TestPageName>.kt`

2. **识别页面中的 Compose 组件**，通过规则文件第五节映射表推断 DOM 渲染组件

3. **查询组件交互特征知识库**（`.claude/rules/kuikly-test-rules.md` 第五节），确定每个渲染组件**必须验证**的交互操作

4. **确定测试级别和输出路径**（取最高级别：L2 > L1 > L0）

5. **生成完整 `.spec.ts` 文件**，严格遵循第六节用例编写规范：
   - 每个操作步骤：定位 → 操作 → 等待渲染 → 截图/断言
   - 使用正确的 fixture 导入路径（参照 2.5 节路径规则表）

6. **输出文件**，并提示：
   ```bash
   cd test-e2e-init
   npx playwright test <生成的spec路径> --update-snapshots
   ```

详细行为规范见 `.claude/rules/kuikly-test-rules.md`。
