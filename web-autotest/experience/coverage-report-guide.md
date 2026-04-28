# Web Autotest 代码覆盖率处理流程与后处理规则

本文档面向 AI 代理和开发者，总结 KuiklyUI web-autotest 的代码覆盖率全流程，包括数据采集、后处理规则、报告生成和阈值校验。

---

## 1. 端到端流程概览

```
Playwright 测试执行 (V8 Coverage 采集)
  → .v8_output/ (原始 V8 JSON 文件)
  → coverage-report.mjs (Monocart 合并 + SourceMap 反向映射)
  → coverage-final.json (Istanbul 格式，JS 行映射到 Kotlin 行)
  → postProcessKotlinCoverage() (Kotlin 行级后处理)
  → Istanbul 报告再生成 (HTML-SPA / LCOV / JSON / JSON-Summary)
  → HTML 补丁 (CSS 颜色 + Kotlin 行状态覆盖)
  → reports/coverage/ (最终产出)
  → --check 模式: 阈值断言
```

入口命令:
```bash
# 完整流程 (含构建+测试+覆盖率)
node web-autotest/scripts/kuikly-test.mjs --full

# 仅生成/校验覆盖率报告 (需已有 .v8_output)
node web-autotest/scripts/coverage-report.mjs

# 仅校验阈值 (不生成 HTML)
node web-autotest/scripts/coverage-report.mjs --check
```

---

## 2. 配置来源

所有覆盖率配置集中在 `web-autotest/kuikly.autotest.config.cjs` 的 `coverage` 字段:

| 配置项 | 值 | 说明 |
|--------|----|------|
| `thresholds` | lines:80, functions:80, branches:70 | 阈值门禁 |
| `watermarks` | lines:[80,90], functions:[80,90], branches:[70,85] | HTML 报告颜色区间 (红/黄/绿) |
| `scopeRoots` | `core-render-web/base/src/jsMain/kotlin`, `core-render-web/h5/src/jsMain/kotlin` | 仅统计这两个目录下的 .kt 文件 |
| `generatedKotlinOutputDir` | `h5App/build/compileSync/js/main/developmentExecutable/kotlin` | 编译产物目录，用于定位 .js + .js.map |
| `targetModules` | `KuiklyCore-render-web-base.js`, `KuiklyCore-render-web-h5.js`, `KuiklyUI-h5App.js` | 仅处理这三个 V8 脚本条目 |
| `v8.reportAnonymousScripts` | true | 采集匿名脚本覆盖率 |
| `v8.resetOnNavigation` | false | 导航时不重置覆盖率计数器 |

报告输出路径配置在 `web-autotest/config/reporting.cjs`:
- 覆盖率报告: `web-autotest/reports/coverage/`
- V8 原始数据: `web-autotest/.v8_output/`

---

## 3. V8 数据采集与合并

1. **Playwright 采集**: `kuikly-test.mjs` 启动 Chromium 时开启 V8 覆盖率 (`page.coverage.startJSCoverage`)，测试结束后写入 `.v8_output/*.json`
2. **条目过滤**: `coverage-report.mjs` 仅保留 URL 中文件名匹配 `targetModules` 的条目 (`isTargetModuleName`)
3. **SourceMap 反向映射**: 对每个 JS 文件读取对应的 `.js.map`，将 V8 的 JS 行号范围映射回 Kotlin 源码行号
4. **源码路径解析**: 使用 `scopeRootAnchor` (scopeRoots 的最长公共前缀 `core-render-web/`) 将 sourceMap 中的路径锚定到项目根目录
5. **作用域过滤**: 仅保留 `isInCoverageScope(filePath)` 为 true 的文件 (路径以某个 scopeRoot 开头且以 `.kt` 结尾)

### 3.1 SourceMap sourcesContent 完整性

**问题**: Kotlin/JS IR 编译器的链接阶段 (`compileDevelopmentExecutableKotlinJs`) 生成的 sourcemap 中，依赖模块（如 base）的 `sourcesContent` 字段可能全部为 null。这导致 MCR (monocart-coverage-reports) 无法完整 remap，丢失函数和语句映射。

**根因**: Gradle build cache 缓存了旧版本的链接任务输出（`sourcesContent` 不完整）。当增量构建时，Gradle 从 cache 恢复这些旧结果 (`FROM-CACHE`)，即使当前编译配置已设置 `sourceMapEmbedSources.set(JsSourceMapEmbedMode.SOURCE_MAP_SOURCE_CONTENT_ALWAYS)`。

**表现**: 例如 Log.kt 有 5 个 `fun`，但 sourcemap 不完整时 MCR 只能 remap 出 3 个函数；完整 sourcemap 下可正确映射全部 5 个函数。

**修复**: `gradleBuildArgs` 配置为 `:h5App:clean :h5App:jsDevelopmentExecutableCompileSync ... --no-build-cache`：
- `:h5App:clean` 删除 `h5App/build/` 目录（含 compileSync 产物），确保 Gradle 不会因输出已存在而跳过重新执行 (UP-TO-DATE)
- `--no-build-cache` 禁止 Gradle 从 build cache 恢复旧的链接结果，强制重新编译和链接

**sourcesContent 磁盘回填**: `readSourceMapForDistFile` 函数在读取 sourcemap 后，对 `sourcesContent` 为 null 的条目尝试从磁盘读取源文件 (`resolveSourceMapSourceFilePath`)。使用 `scopeRootAnchor` 将 sourcemap 中的相对路径（如 `../../../../../../../core-render-web/base/.../Log.kt`）解析为项目中的实际路径。

**短名源问题**: Kotlin/JS IR 编译器为同一源文件生成两个 source 条目 — 长相对路径（如 `../../../../../../../core-render-web/.../Log.kt`）和短名（如 `Log.kt`）。短名无法被 `resolveSourceMapSourceFilePath` 解析到磁盘文件，`sourcesContent` 保持 null，MCR 会丢弃映射到短名源的代码行。此问题在完整 sourcemap 下通过磁盘回填解决 — 长路径条目被成功回填后，MCR 可正确 remap 大部分映射。

---

## 4. Kotlin 覆盖率后处理规则 (核心)

后处理由 `postProcessKotlinCoverage()` 执行，分为两大阶段:

### 4.1 阶段一: 删除噪音映射 (shouldRemove*)

#### 4.1.1 删除函数映射 (`shouldRemoveFunctionMapping`)
- **合成 accessor** (`<get-`, `<set-`, `_get_`, `_set_`): 总是删除
- **`<init>` 函数** (object/class 初始化器): 总是删除 — JVM/JS 类加载器产物，不属于 Kotlin 源码中的可测试函数，无论执行次数是否 > 0
- **`$default` 方法** (Kotlin 默认参数合成方法): 总是删除 — 编译器生成的合成方法，不是 Kotlin 源码中的函数，无论执行次数是否 > 0
- **零计数属性 accessor 行** (`get()` / `set()`): 删除
- **零计数的类签名行、主构造器属性行、非运行时属性声明行** (不含 `fun`): 删除

#### 4.1.2 删除语句映射 (`shouldRemoveStatementMapping`)
- **类签名行**: 总是删除 (class/interface/object 声明本身不可执行)
- **主构造器中的非运行时初始化属性**: 删除 (仅保留有初始化器的运行时属性)
- **块函数头行** (`fun ... {`): 总是删除 (函数声明本身不是可执行语句，无论函数是否被调用都应视为 neutral)
- **多行函数头行** (通过 `isForceNeutralLine` 判断): 删除 — 多行函数定义的 `fun` 起始行、参数续行和 `): Type {` 关闭行都不是可执行语句
- **合成 accessor 行上的非运行时属性声明**: 删除

#### 4.1.3 删除分支映射 (`shouldRemoveBranchMapping`)
- **全零分支 + 类签名行/非运行时主构造器属性**: 删除
- **全零分支 + 合成 accessor 行上的非运行时属性**: 删除
- **全零分支 + 行在 structural neutral 集中**: 删除 (源映射伪影，如 lateinit 初始化检查)
- **全零分支 + 该行有执行计数 > 0 或有覆盖语句范围重叠**: 删除 (编译产物的 try/catch 或安全调用空值守卫产生的幻影分支；当 `fc.l` 无条目时，也检查是否有 covered statement 的范围与 branch 范围重叠)

### 4.2 阶段二: 行覆盖率重计算 (`computeLineCoverageFromStatements`)

删除噪音映射后，基于剩余语句重新计算每行覆盖率。计算前先构建 **未执行 catch 块行集合** (`buildUnexecutedCatchLineSet`)，用于从源头阻止 spanning statement 对 catch 块的污染 (见 4.2.4)，然后依次执行以下 **promote** 和 **suppress** 规则:

#### 4.2.1 Structural Neutral 行标记

以下行类型被标记为 neutral (不计入覆盖/未覆盖):

| 行类型 | 识别规则 |
|--------|----------|
| 空行 | `!trimmed` |
| 注释行 | `//`, `/*`, `*`, `*/` 开头 |
| 包/导入行 | `package`, `import` 开头 |
| 注解行 | `@` 开头 |
| init 块 | `init {` 开头 |
| 结构性 else | `} else {` / `else {` (无执行逻辑) |
| 纯关闭行 | `)`, `]`, `}`, `;`, `,` 等收尾符号 |
| 类签名行 | `class`/`interface`/`object` 声明 (含修饰符) |
| 非运行时属性声明 | `const val` 或无初始化器的 `val`/`var` |
| 抽象接口成员函数 | interface 内的抽象 `fun` (无 `{`) |
| 块函数头行 | `fun ... {` — 函数声明本身不是可执行语句，无论函数是否被调用都视为 neutral |
| 多行函数头行 | `fun ...(` 起始行及其参数续行、`): Type {` 关闭行 — 使用 `inFunctionHeader` 状态追踪；排除表达式体函数 (`fun ... = expr`) |

#### 4.2.2 Promote 规则 (从已覆盖上下文推断覆盖)

| 规则 | 逻辑 |
|------|------|
| `applyCoveredContinuationCandidates` | 多行语句的后续行 (以 `(`, `.`, `?.`, `?:`, `||`, `&&` 等开头) 继承首行覆盖计数 |
| `applyCoveredConstructorDelegationContinuations` | 构造器委托 (`constructor(...) : this(...)`) 的后续行继承起始行计数 |
| `applyConstructorInitializerFallback` | 主构造器中的运行时初始化属性继承构造器的函数计数 |
| `applyClassBodyRuntimePropertyFallback` | 类体中的运行时初始化属性，若被某已覆盖语句跨行覆盖，则继承最大计数 |
| `propagateCoveredBranchBodyLines` | 分支体内仅一行时，该行继承分支计数 |
| `promoteDirectCoveredBranchBodyLines` | 分支体内 ≤4 行时，无直接语句计数的行继承分支/跨行语句计数 |
| `applySimpleFunctionBodyFallback` | 函数体 ≤3 行且无复杂控制流时，未覆盖行继承已覆盖行计数 |
| `promoteCoveredSimpleFunctionGapLines` | 简单函数体中，前后行都已覆盖的中间空隙行 (简单表达式) 继承覆盖 |
| `alignFunctionHeaderCoverageWithBody` | 函数签名行继承函数体的最大覆盖计数 |
| `promoteCoveredTopLevelFunctionStatements` | 函数顶层 ≤6 个可执行行，未覆盖行继承已覆盖行计数 |
| `promoteCoveredBlockFunctionHeaderLines` | ~~已废弃~~ — 块函数头行 (`fun ... {`) 现已归入 structural neutral，不再 promote |
| `promoteCoveredAccessorHeaderLines` | `get() {` / `set() {` 头行，若体有已覆盖行，则继承 |
| `promoteCoveredMultilineExpressionBodiedFunctionHeaderLines` | 多行表达式体函数的头行 (如 `fun ... =`) 继承下一行覆盖 |
| `promoteSimpleLambdaBodyCoverage` | Lambda 体 ≤6 行时，未覆盖行继承函数计数或已覆盖行计数 |
| `promoteCoveredBuilderWrapperLines` | `.apply {` / `.also {` / `.let {` / `.run {` 行继承体内已覆盖行计数 |
| `promoteCoveredWhenHeaderLines` | `when {` 行，若体内有已覆盖行，则继承最大计数 |
| `promoteCoveredWhenArmHeaderLines` | `-> {` 分支行，若体内有已覆盖行，则继承 |
| `promoteCoveredLoopHeaderLines` | `forEach {` / `for (...) {` / `while (...) {` 行继承体内覆盖 |
| `promoteCoveredMultilineStatementLines` | 跨行语句的后续行 (是 continuation line) 继承首行计数 |
| `promoteCoveredMultilineStatementTailLines` | 跨行语句的最后一行，若下一行是 `}?.`/`}.`/`},`/`})` 则继承 |
| `promoteCoveredSmallFunctionStatementBodyLines` | 跨行语句 (≤14行) 在小函数内时，中间行继承覆盖 |
| `promoteCoveredMultilineCallStarterLines` | 以 `(` 或 `[` 结尾的调用起始行，若后续行有覆盖则继承 |
| `promoteCoveredUncoveredMultilineCallStarterLines` | 同上，但起始行本身计数为 0 时也尝试推断 |
| `promoteCoveredSafeCallStarterLines` | `?.funcName(` 行，若后续行有覆盖则继承 |

#### 4.2.3 Suppress 规则 (纠正虚假覆盖)

| 规则 | 逻辑 |
|------|------|
| `suppressFalseCoveredLinesInUncoveredBranches` | 未覆盖分支臂内的行，若无直接语句计数且无可靠执行证据，则设为 0 |
| `suppressFalseCoveredLinesInUncoveredFunctions` | 未调用函数体内的行，若无局部执行证据，则设为 0。关键细节: (1) Lambda/匿名函数使用自身 loc 范围做 suppress，不向上扩展到外层函数 — 扩展会错误包含兄弟 lambda 的覆盖语句; (2) 使用 `locEndLine` 代替 `findBlockEndLine` 确定 suppress 范围 — 后者在包含嵌套 lambda/class 的方法中可能过早结束; (3) 当 `hasLocalCoveredExecution=false` 时无条件 suppress 所有覆盖行 — 函数从未被调用时，范围内的 statement 覆盖都来自外层 spanning statement |
| `suppressFalseCoveredWhenElseTailLines` | `when` 中 `else ->` 行，若仅有一个已覆盖的非 else 分支且计数相同，则 else 设为 0 (源映射伪影) |
| `suppressFalseCoveredLinesInUncoveredWhenArms` | 未覆盖 when 臂体内的行，若无局部执行证据则设为 0 |
| `suppressTerminalCatchNullCoverageNoise` | catch 块末尾的 `null` 行，若前面行都未覆盖则设为 0 |
| `suppressWhenTryCatchFallbackReturnNoise` | when 分支内 try/catch 后的 `return null`，若分支内无真实覆盖则设为 0 |
| `suppressChainedTryFallbackReturnNoise` | 多层 try/catch 后的 `return ...` (非 null)，若无 catch 体覆盖则设为 0 |
| `suppressSuspiciousBlockFunctionHeaderLineCounts` | `fun ... {` 头行有覆盖计数但无直接语句计数时，删除 (防止跨行语句误标)；现已由 structural neutral 机制兜底 |
| `suppressSuspiciousPropertyDeclarationHeadLineCounts` | 无初始化器的属性声明行有覆盖计数但无直接语句时，删除 |
| `suppressSuspiciousInitializedPropertyHeaderLineCounts` | 多行初始化属性头行有覆盖计数但无直接语句时，删除 |
| `suppressPromotedLinesInUncoveredCatchBlocks` | 未覆盖 catch 块内被中间 promote 规则错误推断为覆盖的行 (无 direct statement coverage)，重置为 0。作为 source 层预防之后的安全网 |
| `applyFunctionCoverageFallback` | 当 stmtMap 为空 (MCR sourcemap remap 未生成语句映射) 但 fnMap 有已覆盖函数时，从函数 loc 范围推导行覆盖。处理如 object 内表达式体函数仅生成 fnMap 但无 stmtMap 的情况 |

#### 4.2.5 未调用函数体内假覆盖 Suppress 细节

**问题**: Kotlin/JS 编译器生成的 object/class 初始化器会产生巨大的 spanning statement (如 L74-L513)，其执行计数来自类加载而非函数调用。这些 spanning statement 的 continuation candidates 会将覆盖计数传播到未调用函数体内的行，导致逻辑不一致 (函数 count=0 但体内行显示覆盖)。

**`hasLocalCoveredExecution` 判定逻辑**:

统一使用 `hasCoveredNestedFunctionContainedInRange` 判断 — 只有当函数范围内存在**已覆盖的嵌套函数**时，才认为函数有局部执行证据。不使用 `hasCoveredStatementContainedInRange` 或 `hasCoveredSpanningStatementStartingOnLine`，因为:
- 覆盖的 statement 可能来自外层 spanning statement，不代表函数被调用
- 从函数起始行开始的 spanning statement (如 object 初始化器) 也不代表函数入口被执行

**`hasCoveredNestedFunctionContainedInRange` Sibling 排除**:

Kotlin/JS 编译器为同一 lambda 生成多个 fnMap 条目 (如 `lambda` 和 `lambda_0`、`lambda_1`)。同 loc 的 sibling 有覆盖不代表目标函数有覆盖。匹配条件: start (line + column) 相同且 end line 相同 — end column 可能因 sourcemap 生成差异而不同，不作为匹配条件。同时排除 sourcemap 异常 (end line < start line) 的函数。

**Lambda 函数范围确定**:

- Lambda/匿名函数 (loc 起始行不含 `fun` 关键字): 使用自身 loc 范围 (locStartLine ~ locEndLine)
- 命名 `fun` 函数: 使用 `locEndLine` 作为 suppress 范围结束行 (代替 `findBlockEndLine`)
  - `findBlockEndLine` 从 `{` 计算大括号平衡，在包含嵌套 lambda/class 的方法中可能过早结束 (如 `override fun addAll()` 包含内部匿名类时，`findBlockEndLine` 可能在第一个 `}` 就停止)
  - `locEndLine` 是 V8/Istanbul 认为的完整函数范围

**无条件 Suppress**:

当 `hasLocalCoveredExecution=false` 时，函数确实从未被调用，范围内所有覆盖行都来自外层 spanning statement。此时跳过 `directStatementCount` 和 `hasCoveredExecutionOwnedByFunctionOnLine` 检查，直接将覆盖行设为 0。这两个检查会错误地保护来自 spanning statement 的假覆盖。

#### 4.2.4 未覆盖 Catch 块处理 (三层防护)

**问题**: `return try { ... } catch { ... }` 等结构会产生跨行语句 (spanning statement)，其行范围覆盖 try 和 catch 两个代码路径。V8 记录的执行计数反映的是 try 路径，若不加以处理，spanning statement 会将 try 路径的计数传播到 catch 块行，导致 catch 块行被错误标记为已覆盖。

**根因**: V8/SourceMap 不会为 try-catch 生成有意义的 branchMap 条目 (编译后 JS 中的 IfStatement 分支计数通常为 [0,0])，因此 `suppressFalseCoveredLinesInUncoveredBranches` 的 guard 不触发。

**解决方案**: 采用三层防护机制:

1. **Source 层预防** (`buildUnexecutedCatchLineSet` + 初始扫描过滤): 在 `computeLineCoverageFromStatements` 初始扫描前，构建未执行 catch 块行集合。初始扫描时，spanning statement 的 continuation candidates 跳过这些行，从源头阻止污染。判断 catch 块是否真正执行的依据是 **direct statement count** (起止行相同的 covered statement)，而非 `fc.l` (后者已被 spanning statement 污染)。

2. **lineCoverage 层兜底** (`suppressPromotedLinesInUncoveredCatchBlocks`): 在 `computeLineCoverageFromStatements` 末尾运行，扫描所有 catch 块，若 `catchBlockHasRealExecution` 判定 catch 未执行，则将 `lineCoverage` 中被中间 promote 规则错误推断的行 (无 direct statement coverage，即 `getDirectStatementCountOnLine` 返回 `null` 或 `0`) 重置为 0。此函数作为安全网存在，因为部分 promote 函数缺少 catch 块感知。

3. **status 层防护** (`isLineInUncoveredCatchBlock` guard in `deriveLineStatus`): 在 `lineCount === 0` 和 `lineCount == null` 两个分支中，于所有 promote 函数之前检查当前行是否在未覆盖 catch 块内，若是则直接返回 `'no'`。判断逻辑与第一层一致，使用 `catchBlockHasRealExecution`。

**catch 块是否真正执行的判断** (`catchBlockHasRealExecution`):
- 遍历 catch 块所有行，检查是否有 `getDirectStatementCountOnLine > 0`
- `getDirectStatementCountOnLine` 返回起止行均在同一行且计数 > 0 的最大 statement 计数；无匹配 statement 时返回 `null`
- 只要有一行的 direct statement count > 0，即判定 catch 块已执行
- 不使用 `fc.l` 判断，因为 spanning statement 会污染 `fc.l`

---

## 5. HTML 报告补丁

后处理完成后，`coverage-report.mjs` 对 HTML 报告执行两层补丁:

### 5.1 CSS 颜色补丁
- **base.css**: 添加 `cline-no` (红), `cline-yes` (绿), `cline-neutral` (灰), `cline-partial` (黄), `kotlin-line` 系列样式
- **spa.css**: 添加 `low` (红), `medium` (黄), `high` (绿) 的背景色

### 5.2 Kotlin 行状态覆盖
- 遍历 `reports/coverage/**/*.kt.html` 文件
- 使用 `deriveLineStatus()` 计算每行的最终状态 (`yes`/`no`/`neutral`/`partial`)
- 替换 HTML 中的 `cline-*` 类名和行覆盖文本
- 将代码区 `<pre>` 中的 Istanbul 注解 span 去除，替换为 `<span class="kotlin-line coverage-{status}">` 简化渲染

#### 5.2.1 未覆盖分支臂内行的假 Yes 防护 (`isLineInReliablyUncoveredBranchArm`)

**问题**: `if (condition) { stmt }` 结构中，若 condition 始终为 false，则 `stmt` 行从未执行 (`fc.l=0`)，但 promote 规则 (`getPromotedCoveredFunctionStatementStatus`) 可能因为 `stmt` 行在已覆盖函数内且有 spanning statement 覆盖，将其推断为 `yes`。

**根因**: `isLineInReliablyUncoveredBranchArm` 用于在 promote 前检查行是否在未覆盖分支臂内。旧实现要求 covered branch arm 的 location 有有效的 `start.line` 和 `end.line`，但 Kotlin/JS 编译器生成的 sourcemap 中，if-else 的 else 分支 location 经常是 undefined (仅有 count > 0，无坐标)。

**示例** (Log.kt L15-L16):
```
if (KuiklyProcessor.isDev) {   // L15: count=31354
    log(msg)                    // L16: count=0, 应为 no
}
```
Branch 数据: loc[0] L15-L17 count=0 (true 分支), loc[1] undefined count=31354 (false 分支)。
旧代码: `hasNonEmptyCoveredLocation=false` (loc[1] 无有效坐标) → 函数返回 false → L16 被 promote 为 yes。
修复后: `hasCoveredArm=true` (count[1]=31354 > 0) → L16 在 uncovered arm loc[0] (L15-L17) 内 → 返回 true → L16 不被 promote，正确显示为 no。

### 5.2.2 推断行覆盖计数 (消除假绿色)
- **问题**: `deriveLineStatus` 通过 promote 规则将某些行标记为 `yes`，但 `fc.l` 中没有对应行的计数，导致 HTML 显示绿色但无执行次数
- **解决**: 在 `buildKotlinHtmlLineDataMap` 中，对 `status === 'yes'` 但 `count === null` 的行，从函数或分支覆盖数据推断计数:
  - `inferLineCountFromFunctions`: 找到包含该行的已覆盖函数，返回函数执行计数
  - `inferLineCountFromBranches`: 找到覆盖该行的已覆盖分支，返回最大分支计数

### 5.3 SPA 首页默认
- `index.html` 中设置 `window.metricsToShow = ['lines', 'branches', 'functions']`
- 默认 hash 设为 `#file/desc/true/true/true/true//`

---

## 6. 行状态判定优先级 (`deriveLineStatus`)

1. **structural neutral** → `neutral`
2. **单行空块函数** → 根据函数计数 `yes` 或 `no`
3. **有 V8 行计数 > 0** → 检查是否应在未调用函数中 suppress → `yes` 或 `no`
4. **有 V8 行计数 = 0** → 先检查未覆盖 catch 块 (isLineInUncoveredCatchBlock) → `no`; 否则尝试 promote:
   - when arm 头 → expression-bodied 函数 → expression-bodied accessor → data class 头 → covered 控制头 → 多行控制条件续行 → covered 函数内语句 → 多行初始化属性头 → block 函数头 → 多行控制头 → 控制行
   - promote 成功 → `yes` 或 `partial`
   - 全部失败 → `no`
5. **无 V8 行计数** → 先检查未覆盖 catch 块 → `no`; 否则同样尝试 promote 链
6. **最终回退** → 检查 branchStats: 部分覆盖 → `partial`, 未覆盖 → `no`, 全覆盖 → `yes`, 否则 → `neutral`

---

## 7. 阈值校验

```bash
node web-autotest/scripts/coverage-report.mjs --check
```

- 读取 `reports/coverage/coverage-summary.json` 的 `total` 字段
- 对比 `thresholds` 配置 (lines ≥ 80, functions ≥ 80, branches ≥ 70)
- 任一指标不达标则抛出错误并退出

---

## 8. 闭环循环中的覆盖率使用

在 `run-autotest-loop.mjs` 闭环中:

1. `summarize-coverage.mjs` 读取 `coverage-summary.json` 判断是否达标
2. `suggest-test-targets.mjs` 按优先级排列低覆盖文件和候选扩展页面
3. 不达标时: 批量扩展 carrier page + spec，一次性验证
4. 2+ 轮无法提升时: 检查是否属于 Known headless rendering limits，若是则 accept gap

---

## 9. SKILL.md 中与覆盖率相关的规则

SKILL.md 本身**没有详细说明后处理规则**，但定义了以下与覆盖率相关的决策规则:

- 覆盖率低于阈值时，根据 `coverage-policy.md` 的优先级排序和 `feature-completeness.md` 的最低行为闭合来添加/扩展测试
- 批量改进工作流: 先写所有 Kotlin 改动，再写所有 spec 改动，最后一次性验证
- 不允许: 降低阈值、修改覆盖率脚本作用域来隐藏真实缺口、删除有意义的测试
- `coverage-report.mjs --check` 通过是闭环完成的必要条件之一

---

## 10. 关键文件索引

| 文件 | 职责 |
|------|------|
| `web-autotest/scripts/coverage-report.mjs` | 覆盖率报告生成 + 后处理主脚本 |
| `web-autotest/kuikly.autotest.config.cjs` | 覆盖率配置 (阈值/作用域/目标模块) |
| `web-autotest/config/coverage.cjs` | 配置入口 (转发到 config) |
| `web-autotest/config/reporting.cjs` | 报告路径配置 |
| `web-autotest/references/coverage-policy.md` | 覆盖率策略参考文档 |
| `web-autotest/reports/coverage/` | 覆盖率报告输出目录 |
| `web-autotest/.v8_output/` | V8 原始覆盖率数据 |
