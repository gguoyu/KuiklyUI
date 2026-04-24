import { join } from 'path';
import { createRequire } from 'module';

export const repoRoot = process.cwd();

const _require = createRequire(import.meta.url);
const autotestConfig = _require(join(repoRoot, 'web-autotest', 'kuikly.autotest.config.cjs'));

export const skillScripts = join(repoRoot, 'web-autotest', 'scripts', 'loop');
export const webTestRoot = join(repoRoot, autotestConfig.webTestRoot);
export const testsRoot = join(repoRoot, 'web-autotest', 'tests');
export const reportsDir = join(repoRoot, 'web-autotest', 'reports');
export const coveragePath = join(reportsDir, 'coverage', 'coverage-final.json');
export const playwrightReportPath = join(reportsDir, 'test-results.json');
export const coverageConfigPath = join(repoRoot, 'web-autotest', 'config', 'coverage.cjs');
