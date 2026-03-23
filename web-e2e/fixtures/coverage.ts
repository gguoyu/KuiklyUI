import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * 覆盖率收集工具
 *
 * 工作原理：
 * 1. 测试执行期间，Istanbul 插桩代码将执行路径写入 window.__coverage__
 * 2. 每个 test teardown 时，通过 page.evaluate() 将 __coverage__ 导出为 JSON
 * 3. 写入 .nyc_output/<title>.json，NYC 合并时会读取此目录
 *
 * 前置条件：
 * - 测试服务器必须提供插桩版 h5App.js（通过 npm run serve:instrumented）
 * - 若 window.__coverage__ 不存在（普通服务器），函数静默跳过
 *
 * 自动收集：已在 test-base.ts fixture teardown 中自动调用，无需手动调用。
 */

// coverage.ts 位于 web-e2e/fixtures/，.nyc_output 位于 web-e2e/
const NYC_OUTPUT_DIR = resolve(__dirname, '..', '.nyc_output');

/**
 * 从当前页面收集 window.__coverage__，追加写入 .nyc_output/
 * @param page - Playwright Page 对象
 * @param testTitle - 测试标题，用于文件名（可选）
 */
export async function collectCoverage(page: any, testTitle?: string): Promise<void> {
  try {
    const coverage = await page.evaluate(() => {
      return (window as any).__coverage__ || null;
    });

    if (!coverage) {
      // 非插桩环境，静默跳过
      return;
    }

    // 确保输出目录存在
    if (!existsSync(NYC_OUTPUT_DIR)) {
      mkdirSync(NYC_OUTPUT_DIR, { recursive: true });
    }

    // 生成唯一文件名
    const safeTitle = (testTitle || 'coverage')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 60);
    const filename = `${safeTitle}-${Date.now()}.json`;
    const outputPath = join(NYC_OUTPUT_DIR, filename);

    writeFileSync(outputPath, JSON.stringify(coverage), 'utf8');
    console.log(`[coverage] Saved: ${filename} (${Object.keys(coverage).length} files)`);
  } catch (e) {
    // 不中断测试流程
    console.warn('[coverage] Failed to collect coverage:', (e as Error).message);
  }
}

/**
 * 合并多个 window.__coverage__ 对象
 * 用于在单个测试文件内多个 page 实例的合并场景
 */
export function mergeCoverage(
  a: Record<string, any>,
  b: Record<string, any>
): Record<string, any> {
  const merged = { ...a };
  for (const [file, bData] of Object.entries(b)) {
    if (!merged[file]) {
      merged[file] = bData;
      continue;
    }
    // 合并 statement / branch / function 计数器
    for (const key of ['s', 'b', 'f'] as const) {
      const aCounter = merged[file][key];
      const bCounter = (bData as any)[key];
      if (!aCounter || !bCounter) continue;
      for (const id of Object.keys(bCounter)) {
        if (Array.isArray(bCounter[id])) {
          // branch counter 是数组
          aCounter[id] = (aCounter[id] as number[]).map(
            (v: number, i: number) => v + ((bCounter[id] as number[])[i] || 0)
          );
        } else {
          aCounter[id] = (aCounter[id] as number || 0) + (bCounter[id] as number || 0);
        }
      }
    }
  }
  return merged;
}
