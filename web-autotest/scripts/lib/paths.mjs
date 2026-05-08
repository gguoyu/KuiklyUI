import { join, dirname, isAbsolute } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// ── package 定位 ──────────────────────────────────────────────────────────────
// packageRoot: 本文件（scripts/lib/paths.mjs）上溯两级 → web-autotest/ 包根目录
// 源码模式：<repo>/web-autotest/
// npm 模式：<consumer>/node_modules/@tencent/kuikly-web-aitest/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const packageRoot = join(__dirname, '..', '..');

// ── 项目根目录 ────────────────────────────────────────────────────────────────
// repoRoot: 运行命令的目录（= 消费方项目根，Gradle 也从这里运行）
export const repoRoot = process.cwd();

// ── 消费方脚手架目录 ───────────────────────────────────────────────────────────
// autotestDir: tests/、reports/、kuikly.autotest.config.cjs 所在目录
// 源码模式：同 repoRoot/web-autotest/（= packageRoot）
// npm 模式：消费方自己的 web-autotest/ 目录
// 支持 KUIKLY_AUTOTEST_DIR 环境变量覆盖（绝对路径或相对 repoRoot 的相对路径）
const autotestDirEnv = process.env.KUIKLY_AUTOTEST_DIR;
export const autotestDir = autotestDirEnv
  ? (isAbsolute(autotestDirEnv) ? autotestDirEnv : join(repoRoot, autotestDirEnv))
  : join(repoRoot, 'web-autotest');

// ── 加载项目配置 ───────────────────────────────────────────────────────────────
const _require = createRequire(import.meta.url);
const configPath = process.env.KUIKLY_AUTOTEST_CONFIG
  || join(autotestDir, 'kuikly.autotest.config.cjs');
const autotestConfig = _require(configPath);

// ── 导出路径 ───────────────────────────────────────────────────────────────────
// skillScripts：loop 脚本目录（在包内，不在消费方 scaffold）
export const skillScripts = join(packageRoot, 'scripts', 'loop');

export const webTestRoot = join(repoRoot, autotestConfig.webTestRoot);
export const testsRoot = join(autotestDir, 'tests');
export const reportsDir = join(autotestDir, 'reports');
export const coveragePath = join(reportsDir, 'coverage', 'coverage-final.json');
export const playwrightReportPath = join(reportsDir, 'test-results.json');

// coverageConfigPath: config/coverage.cjs 在包内（通过 kuikly.autotest.config.cjs 的 coverage 字段读取）
export const coverageConfigPath = join(packageRoot, 'config', 'coverage.cjs');
