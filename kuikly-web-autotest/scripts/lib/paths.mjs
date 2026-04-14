import { join } from 'path';

export const repoRoot = process.cwd();
export const skillScripts = join(repoRoot, 'kuikly-web-autotest', 'scripts');
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
export const testsRoot = join(repoRoot, 'web-e2e', 'tests');
export const reportsDir = join(repoRoot, 'web-e2e', 'reports');
export const coveragePath = join(reportsDir, 'coverage', 'coverage-final.json');
export const playwrightReportPath = join(reportsDir, 'test-results.json');
export const nycrcPath = join(repoRoot, 'web-e2e', '.nycrc.json');
