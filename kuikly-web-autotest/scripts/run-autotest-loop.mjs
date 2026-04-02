#!/usr/bin/env node

import { execFileSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative, sep } from 'path';

const repoRoot = process.cwd();
const skillRoot = join(repoRoot, 'kuikly-web-autotest');
const skillScripts = join(skillRoot, 'scripts');
const webTestRoot = join(
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
const testsRoot = join(repoRoot, 'web-e2e', 'tests');
const fixtureEntry = join(repoRoot, 'web-e2e', 'fixtures', 'test-base');
const reportsDir = join(repoRoot, 'web-e2e', 'reports', 'autotest');

const rawArgs = process.argv.slice(2);

function hasFlag(flag) {
  return rawArgs.includes(flag);
}

function getArg(flag) {
  const exact = rawArgs.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) {
    return exact.slice(flag.length + 1);
  }

  const index = rawArgs.indexOf(flag);
  if (index === -1) {
    return null;
  }

  const next = rawArgs[index + 1];
  if (!next || next.startsWith('--')) {
    return null;
  }

  return next;
}

function parseIntegerArg(flag, fallback) {
  const value = getArg(flag);
  if (value == null) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    console.error(`\`${flag}\` must be a non-negative integer.`);
    process.exit(1);
  }
  return parsed;
}

const options = {
  retries: parseIntegerArg('--retries', 1),
  maxNewSpecs: parseIntegerArg('--max-new-specs', 3),
  dryRun: hasFlag('--dry-run'),
  mutateOnly: hasFlag('--mutate-only'),
  skipScan: hasFlag('--skip-scan'),
  skipCoverageCheck: hasFlag('--skip-coverage-check'),
  allowIncompleteScan: hasFlag('--allow-incomplete-scan'),
  updateSnapshots: hasFlag('--update-snapshots'),
  headed: hasFlag('--headed'),
  debug: hasFlag('--debug'),
  skipBuild: hasFlag('--skip-build'),
  level: getArg('--level'),
  test: getArg('--test'),
};

function toPosix(filePath) {
  return filePath.split(sep).join('/');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function walkFiles(root, predicate) {
  const results = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !existsSync(current)) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (predicate(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  return results.sort();
}

function ensureDirectoryFor(filePath) {
  const dirPath = dirname(filePath);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function runNodeScript(scriptName) {
  const output = execFileSync(process.execPath, [join(skillScripts, scriptName)], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

function tryLoadJson(scriptName) {
  try {
    return runNodeScript(scriptName);
  } catch (error) {
    return {
      error: error.message,
      script: scriptName,
    };
  }
}

function runCommand(label, command, args, { allowFailure = false } = {}) {
  console.log(`\n[autotest] ${label}`);
  console.log(`[autotest] command: ${command} ${args.join(' ')}`.trim());

  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  const status = result.status ?? 1;
  if (status !== 0 && !allowFailure) {
    throw new Error(`${label} failed with exit code ${status}`);
  }

  return {
    status,
    failed: status !== 0,
  };
}

function buildCanonicalArgs() {
  const args = ['web-e2e/scripts/kuikly-test.mjs', '--full'];

  if (options.skipBuild) args.push('--skip-build');
  if (options.updateSnapshots) args.push('--update-snapshots');
  if (options.headed) args.push('--headed');
  if (options.debug) args.push('--debug');
  if (options.level) args.push('--level', options.level);
  if (options.test) args.push('--test', options.test);

  return args;
}

function runCoverageCheck() {
  return runCommand('Check coverage thresholds', process.execPath, ['web-e2e/scripts/coverage-report.mjs', '--check'], {
    allowFailure: true,
  });
}

function collectQuotedStrings(text) {
  const values = [];
  const pattern = /"((?:[^"\\]|\\.)*)"/g;
  let match = pattern.exec(text);

  while (match) {
    values.push(match[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\t/g, ' ').replace(/\\\\/g, '\\'));
    match = pattern.exec(text);
  }

  return values;
}

function escapeTemplateLiteral(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function extractCallStrings(source, pattern) {
  const values = [];
  let match = pattern.exec(source);
  while (match) {
    values.push(...collectQuotedStrings(match[1] || ''));
    match = pattern.exec(source);
  }
  return values;
}

function normalizeContentText(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return null;
  }
  if (/^[\-+*=|/\\]+$/.test(text)) {
    return null;
  }
  return text;
}

function normalizeActionLabel(value) {
  const text = normalizeContentText(value);
  if (!text) {
    return null;
  }
  if (text.length > 48) {
    return null;
  }
  if (/^[^\p{L}\p{N}+\-]+$/u.test(text) && !['+', '-'].includes(text)) {
    return null;
  }
  return text;
}

function slugifyPageName(pageName) {
  return pageName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function inferManagedSpecPath(pageMeta) {
  const slug = slugifyPageName(pageMeta.pageName);
  const categoryMap = {
    components: ['L0-static', 'components'],
    styles: ['L0-static', 'styles'],
    modules: ['L1-simple', 'modules'],
    interactions: ['L1-simple'],
    animations: ['L2-complex', 'animations'],
    composite: ['L2-complex'],
  };

  const segments = categoryMap[pageMeta.category] || ['L2-complex'];
  return join(testsRoot, ...segments, `auto-${slug}.spec.ts`);
}

function inferFixtureImport(specPath) {
  const importPath = relative(dirname(specPath), fixtureEntry);
  const normalized = toPosix(importPath);
  return normalized.startsWith('.') ? normalized : `./${normalized}`;
}

function maybeReadFile(filePath) {
  if (!filePath || !existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, 'utf8');
}

function extractGotoTargets(content) {
  const targets = [];
  const pattern = /kuiklyPage\.goto\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match = pattern.exec(content);
  while (match) {
    targets.push(match[1]);
    match = pattern.exec(content);
  }
  return unique(targets);
}

function replaceLiteralGotoTarget(content, fromPageName, toPageName) {
  const escapedFrom = fromPageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(kuiklyPage\\.goto\\(\\s*['"])${escapedFrom}(['"]\\s*\\))`, 'g');
  return content.replace(pattern, `$1${toPageName}$2`);
}

function extractLegacyGotoTarget(content) {
  const patterns = [
    /kuiklyPage\.page\.goto\(\s*['"]\?page_name=([^'"]+)['"]\s*\)/,
    /page\.goto\(\s*['"]\?page_name=([^'"]+)['"]\s*\)/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function normalizeLegacyGotoCalls(content, targetPageName) {
  return content
    .replace(/await\s+kuiklyPage\.page\.goto\(\s*['"]\?page_name=[^'"]+['"]\s*\);?/g, `await kuiklyPage.goto('${targetPageName}');`)
    .replace(/await\s+page\.goto\(\s*['"]\?page_name=[^'"]+['"]\s*\);?/g, `await kuiklyPage.goto('${targetPageName}');`);
}

function loadPageCatalog() {
  const pageFiles = walkFiles(webTestRoot, (filePath) => filePath.endsWith('.kt'));
  const pages = pageFiles.map((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    const annotationMatch = source.match(/@Page\("([^"]+)"\)/);
    const pageName = annotationMatch?.[1] || basename(filePath, '.kt');
    const category = toPosix(relative(webTestRoot, filePath)).split('/')[0] || 'root';
    const textStrings = unique(
      extractCallStrings(source, /text\s*\(([^)]{0,400})\)/g)
        .map(normalizeContentText)
        .filter(Boolean)
    );
    const actionLabels = unique(
      [
        ...extractCallStrings(source, /titleAttr\s*\{[\s\S]{0,240}?text\s*\(([^)]{0,400})\)/g),
        ...extractCallStrings(source, /event\s*\{\s*(?:click|longPress)\s*\{[\s\S]{0,1400}?\}\s*\}[\s\S]{0,900}?text\s*\(([^)]{0,400})\)/g),
      ]
        .map(normalizeActionLabel)
        .filter(Boolean)
    ).slice(0, 12);

    const stableTexts = textStrings.filter((text) => !actionLabels.includes(text)).slice(0, 8);
    const titleText = textStrings.find((text) => text.includes(pageName)) || stableTexts[0] || null;

    return {
      pageName,
      category,
      file: toPosix(relative(repoRoot, filePath)),
      absoluteFile: filePath,
      titleText,
      stableTexts,
      actionLabels,
      managedSpecPath: inferManagedSpecPath({ pageName, category }),
    };
  });

  return {
    pages,
    pagesByName: new Map(pages.map((page) => [page.pageName, page])),
  };
}

function managedSpecMetadataFor(pageMeta, reason) {
  return {
    pageName: pageMeta.pageName,
    category: pageMeta.category,
    sourceFile: pageMeta.file,
    reason,
    generatedAt: new Date().toISOString(),
  };
}

function buildManagedSpecContent(pageMeta, reason) {
  const metadata = managedSpecMetadataFor(pageMeta, reason);
  const fixtureImport = inferFixtureImport(pageMeta.managedSpecPath);
  const titleLiteral = pageMeta.titleText ? JSON.stringify(pageMeta.titleText) : 'null';
  const actionLabelsLiteral = JSON.stringify(pageMeta.actionLabels, null, 2);
  const stableTextsLiteral = JSON.stringify(pageMeta.stableTexts.slice(0, 3), null, 2);
  const metadataLiteral = escapeTemplateLiteral(JSON.stringify(metadata));
  const fixtureImportLiteral = escapeTemplateLiteral(fixtureImport);
  const pageNameLiteral = escapeTemplateLiteral(JSON.stringify(pageMeta.pageName));

  return `// @kuikly-autogen ${metadataLiteral}
import { test, expect } from '${fixtureImportLiteral}';

const PAGE_NAME = ${pageNameLiteral};
const TITLE_TEXT = ${titleLiteral};
const STABLE_TEXTS = ${stableTextsLiteral};
const ACTION_LABELS = ${actionLabelsLiteral};

async function expectPageReady(kuiklyPage) {
  if (TITLE_TEXT) {
    await expect(kuiklyPage.page.getByText(TITLE_TEXT, { exact: false }).first()).toBeVisible();
    return;
  }

  if (STABLE_TEXTS.length > 0) {
    await expect(kuiklyPage.page.getByText(STABLE_TEXTS[0], { exact: false }).first()).toBeVisible();
    return;
  }

  await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
}

async function clickLabelIfPresent(kuiklyPage, label) {
  const exact = kuiklyPage.page.getByText(label, { exact: true });
  if (await exact.count()) {
    await exact.first().click({ force: true, timeout: 2000 }).catch(() => {});
    return true;
  }

  const fuzzy = kuiklyPage.page.getByText(label, { exact: false });
  if (await fuzzy.count()) {
    await fuzzy.first().click({ force: true, timeout: 2000 }).catch(() => {});
    return true;
  }

  return false;
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('exercises extracted controls on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    test.skip(ACTION_LABELS.length === 0, 'No clickable labels were extracted from page source.');

    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);

    let clickedCount = 0;
    for (const label of ACTION_LABELS) {
      const clicked = await clickLabelIfPresent(kuiklyPage, label);
      if (!clicked) {
        continue;
      }

      clickedCount += 1;
      await kuiklyPage.page.waitForTimeout(250);
      await expectPageReady(kuiklyPage);
    }

    expect(clickedCount).toBeGreaterThan(0);
  });
});
`;
}

function parseAutogenMetadataFromContent(content) {
  const match = content.match(new RegExp('^// @kuikly-autogen (.+)$', 'm')); 
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function buildSpecIndex() {
  const specFiles = walkFiles(testsRoot, (filePath) => filePath.endsWith('.spec.ts'));
  const entries = [];

  for (const specFile of specFiles) {
    const content = maybeReadFile(specFile);
    if (!content) {
      continue;
    }

    const relativeFile = toPosix(relative(repoRoot, specFile));
    entries.push({
      specFile,
      relativeFile,
      content,
      gotoTargets: extractGotoTargets(content),
      legacyGotoTarget: extractLegacyGotoTarget(content),
      autogenMetadata: parseAutogenMetadataFromContent(content),
    });
  }

  return entries;
}

function resolveOrphanTarget(pageName, pageCatalog) {
  if (!pageName) {
    return null;
  }

  if (pageName === 'CalendarModuleExamplePage' && pageCatalog.pagesByName.has('CalendarModuleTestPage')) {
    return 'CalendarModuleTestPage';
  }

  if (pageName === 'PAGAnimTestPage') {
    return null;
  }

  const candidates = [];
  const normalized = pageName.toLowerCase();
  const normalizedBase = normalized.replace(/example/g, '').replace(/testpage/g, '');

  for (const pageMeta of pageCatalog.pages) {
    const candidate = pageMeta.pageName.toLowerCase();
    const candidateBase = candidate.replace(/testpage/g, '');
    if (candidate.includes(normalized) || normalized.includes(candidate)) {
      candidates.push(pageMeta.pageName);
      continue;
    }
    if (normalizedBase && candidateBase && (candidateBase.includes(normalizedBase) || normalizedBase.includes(candidateBase))) {
      candidates.push(pageMeta.pageName);
    }
  }

  const uniqueCandidates = unique(candidates);
  return uniqueCandidates.length === 1 ? uniqueCandidates[0] : null;
}

function patchHandwrittenSpecFile(specEntry, nextContent, reason, extra = {}) {
  if (nextContent === specEntry.content) {
    return null;
  }

  if (!options.dryRun) {
    writeFileSync(specEntry.specFile, nextContent, 'utf8');
  }

  return {
    type: 'patch_handwritten_spec',
    reason,
    file: specEntry.relativeFile,
    specFile: specEntry.specFile,
    originalContent: specEntry.content,
    dryRun: options.dryRun,
    ...extra,
  };
}

function createMutationContext(dryRun) {
  return {
    dryRun,
    mutations: [],
    revertedMutations: [],
  };
}

function getTargetedTestArgs(specFile) {
  const args = ['web-e2e/scripts/kuikly-test.mjs', '--skip-build', '--test', specFile];
  if (options.headed) args.push('--headed');
  if (options.debug) args.push('--debug');
  if (options.updateSnapshots) args.push('--update-snapshots');
  return args;
}

function rollbackPatchedSpecMutation(mutation) {
  if (!mutation?.specFile || typeof mutation.originalContent !== 'string') {
    return false;
  }

  writeFileSync(mutation.specFile, mutation.originalContent, 'utf8');
  return true;
}

function verifySpecMutation(mutation, verificationLog) {
  if (!mutation || mutation.dryRun) {
    return null;
  }

  const result = runCommand(
    `Verify patched spec: ${mutation.file}`,
    process.execPath,
    getTargetedTestArgs(mutation.file),
    { allowFailure: true }
  );

  const verification = {
    file: mutation.file,
    reason: mutation.reason,
    passed: !result.failed,
    exitCode: result.status,
    rolledBack: false,
  };

  if (!verification.passed) {
    verification.rolledBack = rollbackPatchedSpecMutation(mutation);
  }

  verificationLog.push(verification);
  return verification;
}

function applyAndVerifyHandwrittenRepairs(scan, pageCatalog, dryRun, verificationLog) {
  const context = createMutationContext(dryRun);
  repairHandwrittenOrphanTargets(scan, pageCatalog, context);
  repairHandwrittenSpecsWithoutGoto(scan, pageCatalog, context);

  if (dryRun) {
    return context;
  }

  const appliedMutations = [];
  for (const mutation of context.mutations) {
    if (mutation.type !== 'patch_handwritten_spec') {
      appliedMutations.push(mutation);
      continue;
    }

    const verification = verifySpecMutation(mutation, verificationLog);
    if (verification) {
      mutation.verification = verification;
    }

    if (verification?.passed) {
      appliedMutations.push(mutation);
      continue;
    }

    context.revertedMutations.push(mutation);
  }

  context.mutations = appliedMutations;

  return context;
}

function readManagedSpecMetadata(specPath) {
  if (!existsSync(specPath)) {
    return null;
  }

  const content = readFileSync(specPath, 'utf8');
  const match = content.match(/^\/\/ @kuikly-autogen (.+)$/m);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function loadManagedSpecIndex() {
  const specFiles = walkFiles(testsRoot, (filePath) => filePath.endsWith('.spec.ts'));
  const byPage = new Map();
  const byFile = new Map();

  for (const specFile of specFiles) {
    const metadata = readManagedSpecMetadata(specFile);
    if (!metadata?.pageName) {
      continue;
    }

    const relativeFile = toPosix(relative(repoRoot, specFile));
    byPage.set(metadata.pageName, { specFile, relativeFile, metadata });
    byFile.set(relativeFile, { specFile, relativeFile, metadata });
  }

  return { byPage, byFile };
}

function upsertManagedSpec(pageMeta, reason, context) {
  const targetPath = pageMeta.managedSpecPath;
  const content = buildManagedSpecContent(pageMeta, reason);
  const alreadyExists = existsSync(targetPath);
  const previousContent = alreadyExists ? readFileSync(targetPath, 'utf8') : null;

  if (previousContent === content) {
    return null;
  }

  const mutation = {
    type: alreadyExists ? 'update_spec' : 'create_spec',
    reason,
    pageName: pageMeta.pageName,
    file: toPosix(relative(repoRoot, targetPath)),
    dryRun: context.dryRun,
  };

  if (!context.dryRun) {
    ensureDirectoryFor(targetPath);
    writeFileSync(targetPath, content, 'utf8');
  }

  context.mutations.push(mutation);
  return mutation;
}

function emptyScanResult() {
  return {
    summary: {
      missingSpecCount: 0,
      orphanSpecTargetCount: 0,
      specsWithoutGotoCount: 0,
    },
    missingSpecs: [],
    orphanSpecTargets: [],
    specsWithoutGoto: [],
  };
}

function addManagedSpecsForMissingPages(scan, pageCatalog, context) {
  let changed = 0;

  for (const missing of scan.missingSpecs || []) {
    const pageMeta = pageCatalog.pagesByName.get(missing.pageName);
    if (!pageMeta) {
      continue;
    }
    if (upsertManagedSpec(pageMeta, 'missing-spec', context)) {
      changed += 1;
    }
  }

  return changed;
}

function addManagedSpecsForCoverage(suggestions, pageCatalog, managedIndex, context) {
  const candidatePages = [];

  for (const suggestion of suggestions?.suggestions || []) {
    for (const pageName of suggestion.suggestedPages || []) {
      if (!pageCatalog.pagesByName.has(pageName)) {
        continue;
      }
      if (candidatePages.includes(pageName)) {
        continue;
      }
      candidatePages.push(pageName);
    }
  }

  let createdCount = 0;
  for (const pageName of candidatePages) {
    if (createdCount >= options.maxNewSpecs) {
      break;
    }

    const pageMeta = pageCatalog.pagesByName.get(pageName);
    if (!pageMeta) {
      continue;
    }

    const existingManaged = managedIndex.byPage.get(pageName);
    const reason = existingManaged ? 'coverage-refresh' : 'coverage-gap';
    const mutation = upsertManagedSpec(pageMeta, reason, context);
    if (mutation) {
      createdCount += 1;
    }
  }

  return createdCount;
}

function repairManagedSpecFailures(failureAnalysis, pageCatalog, managedIndex, context) {
  let repairedCount = 0;

  for (const failure of failureAnalysis?.failures || []) {
    const managedEntry = managedIndex.byFile.get(failure.specFile);
    if (!managedEntry) {
      continue;
    }

    const pageMeta = pageCatalog.pagesByName.get(managedEntry.metadata.pageName);
    if (!pageMeta) {
      continue;
    }

    const repairableCategories = new Set(['ELEMENT_NOT_FOUND', 'ASSERTION_FAILED', 'UNKNOWN']);
    if (!repairableCategories.has(failure.category)) {
      continue;
    }

    if (upsertManagedSpec(pageMeta, `failure-repair:${failure.category}`, context)) {
      repairedCount += 1;
    }
  }

  return repairedCount;
}

function repairHandwrittenOrphanTargets(scan, pageCatalog, context) {
  const specIndex = buildSpecIndex();
  let repairedCount = 0;

  for (const orphan of scan?.orphanSpecTargets || []) {
    const specEntry = specIndex.find((entry) => entry.relativeFile === orphan.spec);
    if (!specEntry || specEntry.autogenMetadata) {
      continue;
    }

    const resolvedTarget = resolveOrphanTarget(orphan.pageName, pageCatalog);
    if (!resolvedTarget) {
      continue;
    }

    const nextContent = replaceLiteralGotoTarget(specEntry.content, orphan.pageName, resolvedTarget);
    const mutation = patchHandwrittenSpecFile(specEntry, nextContent, 'orphan-target-remap', {
      fromPageName: orphan.pageName,
      toPageName: resolvedTarget,
    });

    if (mutation) {
      context.mutations.push(mutation);
      repairedCount += 1;
    }
  }

  return repairedCount;
}

function repairHandwrittenSpecsWithoutGoto(scan, pageCatalog, context) {
  const specIndex = buildSpecIndex();
  let repairedCount = 0;

  for (const specFile of scan?.specsWithoutGoto || []) {
    const specEntry = specIndex.find((entry) => entry.relativeFile === specFile);
    if (!specEntry || specEntry.autogenMetadata) {
      continue;
    }

    const legacyTarget = specEntry.legacyGotoTarget;
    if (!legacyTarget || !pageCatalog.pagesByName.has(legacyTarget)) {
      continue;
    }

    const nextContent = normalizeLegacyGotoCalls(specEntry.content, legacyTarget);
    const mutation = patchHandwrittenSpecFile(specEntry, nextContent, 'normalize-legacy-goto', {
      targetPageName: legacyTarget,
    });

    if (mutation) {
      context.mutations.push(mutation);
      repairedCount += 1;
    }
  }

  return repairedCount;
}

function buildFinalStatus(scan, failureAnalysis, coverage, coverageCheck, attemptsUsed, warnings, verificationLog = []) {
  const completenessPassed =
    scan.summary.missingSpecCount === 0 &&
    scan.summary.orphanSpecTargetCount === 0 &&
    scan.summary.specsWithoutGotoCount === 0;
  const testsPassed = (failureAnalysis?.summary?.failedCount || 0) === 0;
  const coveragePassed = Object.values(coverage?.summary || {}).every((metric) => metric.passed !== false);
  const thresholdCheckPassed = coverageCheck ? !coverageCheck.failed : coveragePassed;
  const repairVerificationPassed = verificationLog.every((entry) => entry.passed !== false);

  return {
    completenessPassed,
    testsPassed,
    coveragePassed,
    thresholdCheckPassed,
    repairVerificationPassed,
    overallPassed: completenessPassed && testsPassed && coveragePassed && thresholdCheckPassed && repairVerificationPassed,
    attemptsUsed,
    warningCount: warnings.length,
  };
}

function ensureReportsDir() {
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
}

function writeLoopReport(report) {
  ensureReportsDir();
  const outputPath = join(reportsDir, 'loop-report.json');
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outputPath;
}

function classifyActions(scan, failureAnalysis, coverage, suggestions, warnings, mutations, verificationLog = []) {
  const actions = [];

  if (scan.summary.missingSpecCount > 0) {
    actions.push({
      type: 'ADD_MISSING_SPEC',
      severity: 'needs_edit',
      details: scan.missingSpecs,
    });
  }

  if (scan.summary.orphanSpecTargetCount > 0) {
    actions.push({
      type: 'HANDLE_ORPHAN_SPEC_TARGET',
      severity: 'manual_review',
      details: scan.orphanSpecTargets,
    });
  }

  if (scan.summary.specsWithoutGotoCount > 0) {
    actions.push({
      type: 'REVIEW_NONSTANDARD_SPEC_NAVIGATION',
      severity: 'manual_review',
      details: scan.specsWithoutGoto,
    });
  }

  if (failureAnalysis && failureAnalysis.summary?.failedCount > 0) {
    const categories = failureAnalysis.summary.failureCategories || {};
    for (const [category, count] of Object.entries(categories)) {
      actions.push({
        type: `HANDLE_${category}`,
        severity: ['ELEMENT_NOT_FOUND', 'ASSERTION_FAILED', 'SCREENSHOT_DIFF'].includes(category)
          ? 'likely_test_fix'
          : 'possible_product_issue',
        count,
      });
    }
  }

  const failedMetrics = Object.entries(coverage?.summary || {})
    .filter(([, value]) => value && value.passed === false)
    .map(([metric]) => metric);
  if (failedMetrics.length > 0) {
    actions.push({
      type: 'ADD_COVERAGE_TESTS',
      severity: 'needs_edit',
      failedMetrics,
      topTargets: (suggestions?.suggestions || []).slice(0, 5),
    });
  }

  if (mutations.length > 0) {
    actions.push({
      type: 'AUTO_MUTATIONS_APPLIED',
      severity: 'info',
      count: mutations.length,
      details: mutations,
    });
  }

  const passedVerifications = verificationLog.filter((entry) => entry.passed);
  if (passedVerifications.length > 0) {
    actions.push({
      type: 'HANDWRITTEN_REPAIRS_VERIFIED',
      severity: 'info',
      count: passedVerifications.length,
      details: passedVerifications,
    });
  }

  const failedVerifications = verificationLog.filter((entry) => entry.passed === false);
  if (failedVerifications.length > 0) {
    actions.push({
      type: 'HANDWRITTEN_REPAIRS_ROLLED_BACK',
      severity: 'manual_review',
      count: failedVerifications.length,
      details: failedVerifications,
    });
  }

  if (warnings.length > 0) {
    actions.push({
      type: 'ESCALATIONS',
      severity: 'manual_review',
      count: warnings.length,
      details: warnings,
    });
  }

  return actions;
}

function addCompletenessWarnings(scan, warnings) {
  for (const orphan of scan.orphanSpecTargets || []) {
    warnings.push({
      type: 'orphan-spec-target',
      spec: orphan.spec,
      pageName: orphan.pageName,
      message: 'No safe automatic repair exists for this handwritten spec target. Add the missing web_test page or adjust the spec manually.',
    });
  }

  for (const specFile of scan.specsWithoutGoto || []) {
    warnings.push({
      type: 'spec-without-goto',
      spec: specFile,
      message: 'This spec does not use kuiklyPage.goto() and needs manual review before the loop can reason about completeness safely.',
    });
  }
}

function addVerificationWarnings(verificationLog, warnings) {
  for (const verification of verificationLog || []) {
    if (verification.passed !== false) {
      continue;
    }

    const exists = warnings.some(
      (warning) =>
        warning.type === 'handwritten-repair-verification-failed' &&
        warning.spec === verification.file &&
        warning.reason === verification.reason
    );
    if (exists) {
      continue;
    }

    warnings.push({
      type: 'handwritten-repair-verification-failed',
      spec: verification.file,
      reason: verification.reason,
      rolledBack: verification.rolledBack === true,
      message: verification.rolledBack
        ? 'Automatic handwritten spec repair failed targeted rerun verification and was rolled back.'
        : 'Automatic handwritten spec repair failed targeted rerun verification and needs manual review.',
    });
  }
}

function executeLoop() {
  const pageCatalog = loadPageCatalog();
  const loopReport = {
    generatedAt: new Date().toISOString(),
    options,
    dryRun: options.dryRun,
    mutateOnly: options.mutateOnly,
    scan: null,
    attempts: [],
    finalAnalyses: {},
    mutations: [],
    warnings: [],
    verification: [],
    actions: [],
    finalStatus: null,
  };

  let managedIndex = loadManagedSpecIndex();

  if (!options.skipScan) {
    loopReport.scan = runNodeScript('scan-web-test-pages.mjs');
    addManagedSpecsForMissingPages(loopReport.scan, pageCatalog, loopReport);
    if (loopReport.mutations.length > 0 && !options.dryRun) {
      managedIndex = loadManagedSpecIndex();
      loopReport.scan = runNodeScript('scan-web-test-pages.mjs');
    }

    const scanRepairContext = applyAndVerifyHandwrittenRepairs(loopReport.scan, pageCatalog, options.dryRun, loopReport.verification);
    if (scanRepairContext.mutations.length > 0) {
      loopReport.mutations.push(...scanRepairContext.mutations);
      loopReport.scan = runNodeScript('scan-web-test-pages.mjs');
    }
    addVerificationWarnings(loopReport.verification, loopReport.warnings);

    if (
      !options.allowIncompleteScan &&
      (loopReport.scan.summary.orphanSpecTargetCount > 0 || loopReport.scan.summary.specsWithoutGotoCount > 0)
    ) {
      addCompletenessWarnings(loopReport.scan, loopReport.warnings);
      loopReport.finalAnalyses.failures = tryLoadJson('analyze-playwright-results.mjs');
      loopReport.finalAnalyses.coverage = tryLoadJson('summarize-coverage.mjs');
      loopReport.finalAnalyses.suggestions = tryLoadJson('suggest-test-targets.mjs');
      loopReport.actions = classifyActions(
        loopReport.scan,
        loopReport.finalAnalyses.failures,
        loopReport.finalAnalyses.coverage,
        loopReport.finalAnalyses.suggestions,
        loopReport.warnings,
        loopReport.mutations,
        loopReport.verification
      );
      loopReport.finalStatus = buildFinalStatus(
        loopReport.scan,
        loopReport.finalAnalyses.failures,
        loopReport.finalAnalyses.coverage,
        null,
        0,
        loopReport.warnings,
        loopReport.verification
      );
      return loopReport;
    }
  }

  if (options.dryRun || options.mutateOnly) {
    loopReport.finalAnalyses.failures = tryLoadJson('analyze-playwright-results.mjs');
    loopReport.finalAnalyses.coverage = tryLoadJson('summarize-coverage.mjs');
    loopReport.finalAnalyses.suggestions = tryLoadJson('suggest-test-targets.mjs');

    if (!options.dryRun) {
      managedIndex = loadManagedSpecIndex();
      addManagedSpecsForCoverage(loopReport.finalAnalyses.suggestions, pageCatalog, managedIndex, loopReport);
      if (loopReport.mutations.length > 0) {
        managedIndex = loadManagedSpecIndex();
        if (!options.skipScan) {
          loopReport.scan = runNodeScript('scan-web-test-pages.mjs');
        }
      }
    }

    const safeScan = loopReport.scan || emptyScanResult();
    loopReport.actions = classifyActions(
      safeScan,
      loopReport.finalAnalyses.failures,
      loopReport.finalAnalyses.coverage,
      loopReport.finalAnalyses.suggestions,
      loopReport.warnings,
      loopReport.mutations,
      loopReport.verification
    );
    loopReport.finalStatus = buildFinalStatus(
      safeScan,
      loopReport.finalAnalyses.failures,
      loopReport.finalAnalyses.coverage,
      null,
      0,
      loopReport.warnings,
      loopReport.verification
    );
    return loopReport;
  }

  const maxAttempts = Math.max(1, options.retries + 1);
  for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex += 1) {
    const attemptNumber = attemptIndex + 1;
    const attempt = {
      attempt: attemptNumber,
      canonicalRun: null,
      coverageCheck: null,
      failureAnalysis: null,
      coverageAnalysis: null,
      suggestions: null,
      mutations: [],
      warnings: [],
      rerunTriggered: false,
    };

    attempt.canonicalRun = runCommand(
      `Canonical full run (attempt ${attemptNumber}/${maxAttempts})`,
      process.execPath,
      buildCanonicalArgs(),
      { allowFailure: true }
    );

    attempt.failureAnalysis = tryLoadJson('analyze-playwright-results.mjs');
    attempt.coverageAnalysis = tryLoadJson('summarize-coverage.mjs');
    attempt.suggestions = tryLoadJson('suggest-test-targets.mjs');

    if (!options.skipCoverageCheck && !attempt.coverageAnalysis.error) {
      attempt.coverageCheck = runCoverageCheck();
    }

    const attemptContext = createMutationContext(false);

    repairManagedSpecFailures(attempt.failureAnalysis, pageCatalog, managedIndex, attemptContext);
    const latestScanForRepairs = options.skipScan ? emptyScanResult() : runNodeScript('scan-web-test-pages.mjs');
    const handwrittenRepairContext = applyAndVerifyHandwrittenRepairs(latestScanForRepairs, pageCatalog, false, loopReport.verification);
    attemptContext.mutations.push(...handwrittenRepairContext.mutations);
    addVerificationWarnings(loopReport.verification, loopReport.warnings);

    const coveragePassed = Object.values(attempt.coverageAnalysis.summary || {}).every((metric) => metric.passed !== false);
    if (!coveragePassed) {
      addManagedSpecsForCoverage(attempt.suggestions, pageCatalog, managedIndex, attemptContext);
    }

    attempt.mutations = attemptContext.mutations;
    loopReport.mutations.push(...attempt.mutations);

    if (attempt.mutations.length > 0) {
      managedIndex = loadManagedSpecIndex();
      attempt.rerunTriggered = attemptIndex < maxAttempts - 1;
    }

    loopReport.attempts.push(attempt);

    const testsPassed = (attempt.failureAnalysis.summary?.failedCount || 0) === 0;
    const thresholdCheckPassed = attempt.coverageCheck ? !attempt.coverageCheck.failed : coveragePassed;

    if (testsPassed && coveragePassed && thresholdCheckPassed && attempt.mutations.length === 0) {
      break;
    }

    if (attempt.mutations.length === 0 || !attempt.rerunTriggered) {
      break;
    }
  }

  const lastAttempt = loopReport.attempts[loopReport.attempts.length - 1] || null;
  loopReport.finalAnalyses.failures = lastAttempt?.failureAnalysis || tryLoadJson('analyze-playwright-results.mjs');
  loopReport.finalAnalyses.coverage = lastAttempt?.coverageAnalysis || tryLoadJson('summarize-coverage.mjs');
  loopReport.finalAnalyses.suggestions = lastAttempt?.suggestions || tryLoadJson('suggest-test-targets.mjs');

  if (!options.skipScan) {
    loopReport.scan = runNodeScript('scan-web-test-pages.mjs');
    if (loopReport.scan.summary.orphanSpecTargetCount > 0 || loopReport.scan.summary.specsWithoutGotoCount > 0) {
      addCompletenessWarnings(loopReport.scan, loopReport.warnings);
    }
  }
  addVerificationWarnings(loopReport.verification, loopReport.warnings);

  const safeScan = loopReport.scan || emptyScanResult();
  loopReport.actions = classifyActions(
    safeScan,
    loopReport.finalAnalyses.failures,
    loopReport.finalAnalyses.coverage,
    loopReport.finalAnalyses.suggestions,
    loopReport.warnings,
    loopReport.mutations,
    loopReport.verification
  );
  loopReport.finalStatus = buildFinalStatus(
    safeScan,
    loopReport.finalAnalyses.failures,
    loopReport.finalAnalyses.coverage,
    lastAttempt?.coverageCheck || null,
    loopReport.attempts.length,
    loopReport.warnings,
    loopReport.verification
  );

  return loopReport;
}

try {
  const report = executeLoop();
  const outputPath = writeLoopReport(report);

  console.log(`\n[autotest] loop report written: ${outputPath}`);
  console.log(JSON.stringify(report, null, 2));

  process.exitCode = report.finalStatus?.overallPassed ? 0 : 1;
} catch (error) {
  const failureReport = {
    generatedAt: new Date().toISOString(),
    options,
    error: error.message,
  };
  const outputPath = writeLoopReport(failureReport);
  console.error(`\n[autotest] fatal error: ${error.message}`);
  console.error(`[autotest] loop report written: ${outputPath}`);
  console.error(JSON.stringify(failureReport, null, 2));
  process.exit(1);
}





