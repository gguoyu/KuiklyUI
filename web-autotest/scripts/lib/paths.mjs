import { join } from 'path';

export const repoRoot = process.cwd();
export const skillScripts = join(repoRoot, 'web-autotest', 'scripts', 'loop');
export const webTestRoot = join(
  repoRoot,
  'demo',
  'src',
  'commonMain',
  'kotlin',
  'com',
  'tencent',
  'kuikly',
  'demo',
  'pages',
  'web_test'
);
export const testsRoot = join(repoRoot, 'web-autotest', 'tests');
export const reportsDir = join(repoRoot, 'web-autotest', 'reports');
export const coveragePath = join(reportsDir, 'coverage', 'coverage-final.json');
export const playwrightReportPath = join(reportsDir, 'test-results.json');
export const coverageConfigPath = join(repoRoot, 'web-autotest', 'config', 'coverage.cjs');
