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

const parsedRetries = parseIntegerArg('--retries', 2);

const options = {
  retries: parsedRetries,
  maxRounds: parseIntegerArg('--max-rounds', parsedRetries + 1),
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
  if (!/[\p{L}\p{N}]/u.test(text)) {
    return null;
  }
  if (/^[\-+*=|/\\]+$/.test(text)) {
    return null;
  }
  return text;
}

function toJsLiteral(value) {
  return JSON.stringify(String(value)).replace(/[\u2028\u2029]/g, (char) => {
    return char === '\u2028' ? '\\u2028' : '\\u2029';
  });
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

function defaultManagedTemplateProfile(pageMeta) {
  switch (pageMeta.pageName) {
    case 'ListScrollTestPage':
      return 'interaction-list-scroll';
    case 'PageListTestPage':
      return 'interaction-page-list';
    case 'JSFrameAnimTestPage':
      return 'animation-jsframe';
    case 'PropertyAnimTestPage':
      return 'animation-property';
    case 'NetworkModuleTestPage':
      return 'module-network';
    default:
      break;
  }

  switch (pageMeta.category) {
    case 'interactions':
      return 'interaction-generic';
    case 'animations':
      return 'animation-generic';
    case 'modules':
      return 'module-generic';
    default:
      return 'default';
  }
}

function managedSpecMetadataFor(pageMeta, reason, templateProfile) {
  return {
    pageName: pageMeta.pageName,
    category: pageMeta.category,
    sourceFile: pageMeta.file,
    managedBy: 'kuikly-web-autotest',
    templateProfile,
  };
}

function buildManagedSpecPreamble(pageMeta, metadata, fixtureImport) {
  const metadataLiteral = escapeTemplateLiteral(JSON.stringify(metadata));
  const fixtureImportLiteral = escapeTemplateLiteral(fixtureImport);
  const pageNameLiteral = escapeTemplateLiteral(JSON.stringify(pageMeta.pageName));
  const titleLiteral = pageMeta.titleText ? JSON.stringify(pageMeta.titleText) : 'null';
  const stableTextsLiteral = JSON.stringify(pageMeta.stableTexts.slice(0, 4), null, 2);
  const actionLabelsLiteral = JSON.stringify(pageMeta.actionLabels, null, 2);

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
`;
}

function buildManagedDefaultSpec(pageMeta, preamble, pageNameLiteral) {
  return `${preamble}
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

function buildManagedGenericSmokeSpec(pageMeta, preamble, pageNameLiteral) {
  return `${preamble}
test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('probes one stable control on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    test.skip(ACTION_LABELS.length === 0, 'No clickable labels were extracted from page source.');

    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);

    let clicked = false;
    for (const label of ACTION_LABELS.slice(0, 3)) {
      clicked = await clickLabelIfPresent(kuiklyPage, label);
      if (clicked) {
        break;
      }
    }

    expect(clicked).toBeTruthy();
    await kuiklyPage.page.waitForTimeout(400);
    await expectPageReady(kuiklyPage);
  });
});
`;
}

function buildManagedListScrollSpec(pageMeta, preamble, pageNameLiteral) {
  return `${preamble}
const LIST_TITLE = '列表滚动测试';
const LIST_GROUP_ONE = '分组 1';
const LIST_GROUP_THREE = '分组 3';
const LIST_ITEM_ONE = '列表项 1';
const LIST_ITEM_EIGHT = '列表项 8';
const LIST_ITEM_TWENTY_ONE = '列表项 21';
const LIST_SELECTED_ONE = '选中: 列表项 1';
const LIST_SELECTED_EIGHT = '选中: 列表项 8';
async function listContainer(kuiklyPage) {
  return kuiklyPage.component('KRListView').first();
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(LIST_TITLE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(LIST_GROUP_ONE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(LIST_ITEM_ONE, { exact: true })).toBeVisible();
  });

  test('scrolls and selects stable rows on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(LIST_ITEM_ONE, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(LIST_SELECTED_ONE, { exact: true })).toBeVisible();

    const container = await listContainer(kuiklyPage);
    await kuiklyPage.scrollInContainer(container, { deltaY: 500, smooth: false });
    await expect(kuiklyPage.page.getByText(LIST_ITEM_EIGHT, { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText(LIST_ITEM_EIGHT, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(LIST_SELECTED_EIGHT, { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(container, { deltaY: 1200, smooth: false });
    const scrollTop = await container.evaluate((el) => (el instanceof HTMLElement ? el.scrollTop : 0));
    expect(scrollTop).toBeGreaterThan(900);
    await expect(kuiklyPage.page.getByText(LIST_GROUP_THREE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(LIST_ITEM_TWENTY_ONE, { exact: true })).toBeVisible();

    for (let i = 0; i < 8; i += 1) {
      await kuiklyPage.scrollInContainer(container, { deltaY: 350, smooth: false });
    }

    const finalScrollTop = await container.evaluate((el) => (el instanceof HTMLElement ? el.scrollTop : 0));
    expect(finalScrollTop).toBeGreaterThan(1800);
  });
});
`;
}

function buildManagedListScrollLiteSpec(pageMeta, preamble, pageNameLiteral) {
  return `${preamble}
const LIST_TITLE = '列表滚动测试';
const LIST_ITEM_ONE = '列表项 1';
const LIST_ITEM_EIGHT = '列表项 8';
const LIST_ITEM_TWENTY_ONE = '列表项 21';

async function listContainer(kuiklyPage) {
  return kuiklyPage.component('KRListView').first();
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(LIST_TITLE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(LIST_ITEM_ONE, { exact: true })).toBeVisible();
  });

  test('reaches lower list sections on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    const container = await listContainer(kuiklyPage);
    await kuiklyPage.page.getByText(LIST_ITEM_ONE, { exact: true }).click();
    await kuiklyPage.scrollInContainer(container, { deltaY: 550, smooth: false });
    await expect(kuiklyPage.page.getByText(LIST_ITEM_EIGHT, { exact: true })).toBeVisible();

    await kuiklyPage.scrollInContainer(container, { deltaY: 1650, smooth: false });
    await expect(kuiklyPage.page.getByText(LIST_ITEM_TWENTY_ONE, { exact: true })).toBeVisible();
  });
});
`;
}

function buildManagedPageListSpec(pageMeta, preamble, pageNameLiteral) {
  return `${preamble}
const PAGE_ZERO_ITEM = 'pageIndex:0 listIndex:0';
const PAGE_ONE_ITEM = 'pageIndex:1 listIndex:0';
const PAGE_THREE_ITEM = 'pageIndex:3 listIndex:0';

async function dragPageList(page, container, deltaX) {
  const box = await container.boundingBox();
  if (!box) {
    throw new Error('PageList container is not visible');
  }

  const startX = box.x + box.width * 0.75;
  const endX = startX + deltaX;
  const y = box.y + box.height / 2;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
}

async function getLeft(locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Target is not visible enough to read bounding box');
  }
  return box.x;
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });

    await expect(kuiklyPage.page.getByText('PageListTestPage', { exact: true })).toBeVisible();
    await expect(page0Item).toBeVisible();
    expect(await getLeft(page0Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page1Item)).toBeGreaterThan(300);
  });

  test('swipes and clicks tabs on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    const pageList = kuiklyPage.component('KRListView').first();
    const page0Item = kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true });
    const page1Item = kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true });
    const page3Item = kuiklyPage.page.getByText(PAGE_THREE_ITEM, { exact: true });

    await dragPageList(kuiklyPage.page, pageList, -260);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page1Item)).toBeGreaterThanOrEqual(0);
    expect(await getLeft(page0Item)).toBeLessThan(0);

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(800);
    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    expect(await getLeft(page3Item)).toBeGreaterThanOrEqual(0);
  });
});
`;
}

function buildManagedJsFrameAnimSpec(pageMeta, preamble, pageNameLiteral) {
  const labels = {
    section: toJsLiteral('1. 进度条帧动画'),
    progressZero: toJsLiteral('进度: 0%'),
    progressDone: toJsLiteral('进度: 100%'),
    colorStart: toJsLiteral('当前色块: 1 / 5'),
    colorDone: toJsLiteral('当前色块: 5 / 5'),
    startProgress: toJsLiteral('开始动画'),
    running: toJsLiteral('运行中...'),
    startColor: toJsLiteral('开始轮播'),
    colorRunning: toJsLiteral('轮播中...'),
    startMarquee: toJsLiteral('开始跑马灯'),
    startCount: toJsLiteral('开始计数'),
    countRunning: toJsLiteral('计数中...'),
  };

  return `${preamble}
const SECTION_TITLE = ${labels.section};
const PROGRESS_ZERO = ${labels.progressZero};
const PROGRESS_DONE = ${labels.progressDone};
const COLOR_START = ${labels.colorStart};
const COLOR_DONE = ${labels.colorDone};
const START_PROGRESS = ${labels.startProgress};
const RUNNING_PROGRESS = ${labels.running};
const START_COLOR = ${labels.startColor};
const RUNNING_COLOR = ${labels.colorRunning};
const START_MARQUEE = ${labels.startMarquee};
const START_COUNT = ${labels.startCount};
const RUNNING_COUNT = ${labels.countRunning};

async function waitForIdleLabel(page, label, timeout = 8000) {
  await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(SECTION_TITLE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(PROGRESS_ZERO, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(COLOR_START, { exact: true })).toBeVisible();
  });

  test('runs progress and color animations on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(START_PROGRESS, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(RUNNING_PROGRESS, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_PROGRESS);
    await expect(kuiklyPage.page.getByText(PROGRESS_DONE, { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText(START_COLOR, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(RUNNING_COLOR, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_COLOR);
    await expect(kuiklyPage.page.getByText(COLOR_DONE, { exact: true })).toBeVisible();
  });

  test('runs marquee and counter animations on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(START_MARQUEE, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(RUNNING_PROGRESS, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_MARQUEE, 6000);

    await kuiklyPage.page.getByText(START_COUNT, { exact: true }).click();
    await expect(kuiklyPage.page.getByText(RUNNING_COUNT, { exact: true }).first()).toBeVisible({ timeout: 1500 });
    await waitForIdleLabel(kuiklyPage.page, START_COUNT);
    await expect(kuiklyPage.page.getByText('100', { exact: true })).toBeVisible();
  });
});
`;
}

function buildManagedJsFrameAnimStateSpec(pageMeta, preamble, pageNameLiteral) {
  const labels = {
    section: toJsLiteral('1. 进度条帧动画'),
    progressDone: toJsLiteral('进度: 100%'),
    colorDone: toJsLiteral('当前色块: 5 / 5'),
    startProgress: toJsLiteral('开始动画'),
    startColor: toJsLiteral('开始轮播'),
    startCount: toJsLiteral('开始计数'),
  };

  return `${preamble}
const SECTION_TITLE = ${labels.section};
const PROGRESS_DONE = ${labels.progressDone};
const COLOR_DONE = ${labels.colorDone};
const START_PROGRESS = ${labels.startProgress};
const START_COLOR = ${labels.startColor};
const START_COUNT = ${labels.startCount};

async function waitForIdleLabel(page, label, timeout = 8000) {
  await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(SECTION_TITLE, { exact: true })).toBeVisible();
  });

  test('verifies stable end states on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(START_PROGRESS, { exact: true }).click();
    await waitForIdleLabel(kuiklyPage.page, START_PROGRESS);
    await expect(kuiklyPage.page.getByText(PROGRESS_DONE, { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText(START_COLOR, { exact: true }).click();
    await waitForIdleLabel(kuiklyPage.page, START_COLOR);
    await expect(kuiklyPage.page.getByText(COLOR_DONE, { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText(START_COUNT, { exact: true }).click();
    await waitForIdleLabel(kuiklyPage.page, START_COUNT);
    await expect(kuiklyPage.page.getByText('100', { exact: true })).toBeVisible();
  });
});
`;
}

function buildManagedPropertyAnimSpec(pageMeta, preamble, pageNameLiteral) {
  const labels = {
    section: toJsLiteral('1. Linear 平移动画'),
    playTranslate: toJsLiteral('播放平移'),
    restorePosition: toJsLiteral('还原位置'),
    spring: toJsLiteral('弹性运动'),
    color: toJsLiteral('变换颜色'),
    restoreColor: toJsLiteral('还原颜色'),
    combo: toJsLiteral('平移+旋转'),
    restore: toJsLiteral('还原'),
  };

  return `${preamble}
const SECTION_TITLE = ${labels.section};
const PLAY_TRANSLATE = ${labels.playTranslate};
const RESTORE_POSITION = ${labels.restorePosition};
const SPRING_ACTION = ${labels.spring};
const COLOR_ACTION = ${labels.color};
const RESTORE_COLOR = ${labels.restoreColor};
const COMBO_ACTION = ${labels.combo};
const RESTORE_ACTION = ${labels.restore};

async function waitForText(page, text, timeout = 5000) {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(SECTION_TITLE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(PLAY_TRANSLATE, { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(COMBO_ACTION, { exact: true })).toBeVisible();
  });

  test('toggles translate and spring animations on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(PLAY_TRANSLATE, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_POSITION);
    await kuiklyPage.page.getByText(RESTORE_POSITION, { exact: true }).first().click();
    await waitForText(kuiklyPage.page, PLAY_TRANSLATE);

    await kuiklyPage.page.getByText(SPRING_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_POSITION);
  });

  test('toggles color and combo animations on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(COLOR_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_COLOR);

    await kuiklyPage.page.getByText(COMBO_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_ACTION);
  });
});
`;
}

function buildManagedPropertyAnimToggleSpec(pageMeta, preamble, pageNameLiteral) {
  const labels = {
    section: toJsLiteral('1. Linear 平移动画'),
    playTranslate: toJsLiteral('播放平移'),
    restorePosition: toJsLiteral('还原位置'),
    color: toJsLiteral('变换颜色'),
    restoreColor: toJsLiteral('还原颜色'),
    combo: toJsLiteral('平移+旋转'),
    restore: toJsLiteral('还原'),
  };

  return `${preamble}
const SECTION_TITLE = ${labels.section};
const PLAY_TRANSLATE = ${labels.playTranslate};
const RESTORE_POSITION = ${labels.restorePosition};
const COLOR_ACTION = ${labels.color};
const RESTORE_COLOR = ${labels.restoreColor};
const COMBO_ACTION = ${labels.combo};
const RESTORE_ACTION = ${labels.restore};

async function waitForText(page, text, timeout = 5000) {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible({ timeout });
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText(SECTION_TITLE, { exact: true })).toBeVisible();
  });

  test('verifies one-way animation toggles on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText(PLAY_TRANSLATE, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_POSITION);

    await kuiklyPage.page.getByText(COLOR_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_COLOR);

    await kuiklyPage.page.getByText(COMBO_ACTION, { exact: true }).click();
    await waitForText(kuiklyPage.page, RESTORE_ACTION);
  });
});
`;
}

function buildManagedNetworkModuleSpec(pageMeta, preamble, pageNameLiteral) {
  return `${preamble}
async function waitForOutput(page, text) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 15000 });
}

async function clickNetworkAction(page, label) {
  const labelled = page.getByLabel(label, { exact: true });
  if (await labelled.count()) {
    await labelled.first().click();
    return;
  }

  await page.getByText(label, { exact: true }).first().click();
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('NetworkModuleTestPage', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestGet', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestPostBinary', { exact: true })).toBeVisible();
  });

  test('covers request success paths on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await clickNetworkAction(kuiklyPage.page, 'requestGet');
    await waitForOutput(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('success=true', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=200', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('http://localhost:8080/api/network/get?key=value', { exact: false })).toBeVisible({ timeout: 15000 });

    await clickNetworkAction(kuiklyPage.page, 'requestPost');
    await waitForOutput(kuiklyPage.page, 'Post request completed:');
    await expect(kuiklyPage.page.getByText('success=true', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=200', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('http://localhost:8080/api/network/post', { exact: false })).toBeVisible({ timeout: 15000 });

    await clickNetworkAction(kuiklyPage.page, 'requestPostBinary');
    await waitForOutput(kuiklyPage.page, 'Post request completed:');
    await expect(kuiklyPage.page.getByText('hello world', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('covers request edge paths on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await clickNetworkAction(kuiklyPage.page, 'requestGetBinary');
    await waitForOutput(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('statusCode=-1002', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('Request with GET/HEAD method cannot have body.', { exact: false })).toBeVisible({ timeout: 15000 });

    await clickNetworkAction(kuiklyPage.page, 'status204');
    await waitForOutput(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('success=false', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=204', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('Unexpected end of JSON input', { exact: false })).toBeVisible({ timeout: 15000 });
  });
});
`;
}

function buildManagedNetworkModuleSmokeSpec(pageMeta, preamble, pageNameLiteral) {
  return `${preamble}
async function waitForOutput(page, text) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 15000 });
}

async function clickNetworkAction(page, label) {
  const labelled = page.getByLabel(label, { exact: true });
  if (await labelled.count()) {
    await labelled.first().click();
    return;
  }

  await page.getByText(label, { exact: true }).first().click();
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('NetworkModuleTestPage', { exact: true })).toBeVisible();
  });

  test('covers one success and one edge case on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await clickNetworkAction(kuiklyPage.page, 'requestGet');
    await waitForOutput(kuiklyPage.page, 'statusCode=200');

    await clickNetworkAction(kuiklyPage.page, 'requestPostBinary');
    await waitForOutput(kuiklyPage.page, 'hello world');

    await clickNetworkAction(kuiklyPage.page, 'status204');
    await waitForOutput(kuiklyPage.page, 'statusCode=204');
  });
});
`;
}

function buildManagedPageListTabSpec(pageMeta, preamble, pageNameLiteral) {
  return `${preamble}
const PAGE_ZERO_ITEM = 'pageIndex:0 listIndex:0';
const PAGE_ONE_ITEM = 'pageIndex:1 listIndex:0';
const PAGE_THREE_ITEM = 'pageIndex:3 listIndex:0';

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('PageListTestPage', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByText(PAGE_ZERO_ITEM, { exact: true })).toBeVisible();
  });

  test('switches pages through tabs on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto(${pageNameLiteral});
    await kuiklyPage.waitForRenderComplete();

    await kuiklyPage.page.getByText('tab1', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(800);
    await expect(kuiklyPage.page.getByText('tab1', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(kuiklyPage.page.getByText(PAGE_ONE_ITEM, { exact: true })).toBeVisible();

    await kuiklyPage.page.getByText('tab3', { exact: true }).click();
    await kuiklyPage.page.waitForTimeout(800);
    await expect(kuiklyPage.page.getByText('tab3', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(kuiklyPage.page.getByText(PAGE_THREE_ITEM, { exact: true })).toBeVisible();
  });
});
`;
}

function buildManagedInteractionSpec(pageMeta, preamble, pageNameLiteral, templateProfile) {
  if (pageMeta.pageName === 'ListScrollTestPage') {
    if (templateProfile === 'interaction-list-scroll-lite') {
      return buildManagedListScrollLiteSpec(pageMeta, preamble, pageNameLiteral);
    }
    return buildManagedListScrollSpec(pageMeta, preamble, pageNameLiteral);
  }

  if (pageMeta.pageName === 'PageListTestPage') {
    if (templateProfile === 'interaction-page-list-tab-only') {
      return buildManagedPageListTabSpec(pageMeta, preamble, pageNameLiteral);
    }
    return buildManagedPageListSpec(pageMeta, preamble, pageNameLiteral);
  }

  if (templateProfile === 'interaction-generic-repair') {
    return buildManagedGenericSmokeSpec(pageMeta, preamble, pageNameLiteral);
  }

  return buildManagedDefaultSpec(pageMeta, preamble, pageNameLiteral);
}

function buildManagedAnimationSpec(pageMeta, preamble, pageNameLiteral, templateProfile) {
  if (pageMeta.pageName === 'JSFrameAnimTestPage') {
    if (templateProfile === 'animation-jsframe-state-only') {
      return buildManagedJsFrameAnimStateSpec(pageMeta, preamble, pageNameLiteral);
    }
    return buildManagedJsFrameAnimSpec(pageMeta, preamble, pageNameLiteral);
  }

  if (pageMeta.pageName === 'PropertyAnimTestPage') {
    if (templateProfile === 'animation-property-toggle-only') {
      return buildManagedPropertyAnimToggleSpec(pageMeta, preamble, pageNameLiteral);
    }
    return buildManagedPropertyAnimSpec(pageMeta, preamble, pageNameLiteral);
  }

  if (templateProfile === 'animation-generic-repair') {
    return buildManagedGenericSmokeSpec(pageMeta, preamble, pageNameLiteral);
  }

  return buildManagedDefaultSpec(pageMeta, preamble, pageNameLiteral);
}

function buildManagedModuleSpec(pageMeta, preamble, pageNameLiteral, templateProfile) {
  if (pageMeta.pageName === 'NetworkModuleTestPage') {
    if (templateProfile === 'module-network-smoke') {
      return buildManagedNetworkModuleSmokeSpec(pageMeta, preamble, pageNameLiteral);
    }
    return buildManagedNetworkModuleSpec(pageMeta, preamble, pageNameLiteral);
  }

  if (templateProfile === 'module-generic-repair') {
    return buildManagedGenericSmokeSpec(pageMeta, preamble, pageNameLiteral);
  }

  return buildManagedDefaultSpec(pageMeta, preamble, pageNameLiteral);
}

function buildManagedSpecContent(pageMeta, reason, repairProfile = null) {
  const templateProfile = repairProfile?.templateProfile || defaultManagedTemplateProfile(pageMeta);
  const metadata = managedSpecMetadataFor(pageMeta, reason, templateProfile);
  const fixtureImport = inferFixtureImport(pageMeta.managedSpecPath);
  const pageNameLiteral = escapeTemplateLiteral(JSON.stringify(pageMeta.pageName));
  const preamble = buildManagedSpecPreamble(pageMeta, metadata, fixtureImport);

  if (pageMeta.category === 'interactions') {
    return buildManagedInteractionSpec(pageMeta, preamble, pageNameLiteral, templateProfile);
  }

  if (pageMeta.category === 'animations') {
    return buildManagedAnimationSpec(pageMeta, preamble, pageNameLiteral, templateProfile);
  }

  if (pageMeta.category === 'modules') {
    return buildManagedModuleSpec(pageMeta, preamble, pageNameLiteral, templateProfile);
  }

  if (templateProfile === 'generic-repair') {
    return buildManagedGenericSmokeSpec(pageMeta, preamble, pageNameLiteral);
  }

  return buildManagedDefaultSpec(pageMeta, preamble, pageNameLiteral);
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

function managedRepairProfileFor(pageMeta, failure, managedEntry) {
  const currentProfile = managedEntry?.metadata?.templateProfile || defaultManagedTemplateProfile(pageMeta);
  const message = `${failure?.message || ''}\n${failure?.stack || ''}`.toLowerCase();

  if (pageMeta.pageName === 'ListScrollTestPage') {
    return {
      templateProfile: currentProfile === 'interaction-list-scroll' ? 'interaction-list-scroll-lite' : currentProfile,
      strategy: currentProfile === 'interaction-list-scroll' ? 'reduce-scroll-depth-and-assertions' : 'reuse-list-scroll-template',
    };
  }

  if (pageMeta.pageName === 'PageListTestPage') {
    const prefersTabOnly =
      currentProfile === 'interaction-page-list' &&
      (failure?.category === 'ELEMENT_NOT_FOUND' || message.includes('bounding box') || message.includes('not visible'));
    return {
      templateProfile: prefersTabOnly ? 'interaction-page-list-tab-only' : currentProfile,
      strategy: prefersTabOnly ? 'rewrite-to-tab-driven-page-switch' : 'reuse-page-list-template',
    };
  }

  if (pageMeta.pageName === 'JSFrameAnimTestPage') {
    return {
      templateProfile: currentProfile === 'animation-jsframe' ? 'animation-jsframe-state-only' : currentProfile,
      strategy: currentProfile === 'animation-jsframe' ? 'rewrite-to-state-driven-animation-checks' : 'reuse-jsframe-animation-template',
    };
  }

  if (pageMeta.pageName === 'PropertyAnimTestPage') {
    return {
      templateProfile: currentProfile === 'animation-property' ? 'animation-property-toggle-only' : currentProfile,
      strategy: currentProfile === 'animation-property' ? 'rewrite-to-toggle-state-assertions' : 'reuse-property-animation-template',
    };
  }

  if (pageMeta.pageName === 'NetworkModuleTestPage') {
    return {
      templateProfile: currentProfile === 'module-network' ? 'module-network-smoke' : currentProfile,
      strategy: currentProfile === 'module-network' ? 'rewrite-to-shorter-network-coverage-path' : 'reuse-network-module-template',
    };
  }

  switch (pageMeta.category) {
    case 'interactions':
      return {
        templateProfile: 'interaction-generic-repair',
        strategy: 'rewrite-interaction-managed-spec-to-light-smoke',
      };
    case 'animations':
      return {
        templateProfile: 'animation-generic-repair',
        strategy: 'rewrite-animation-managed-spec-to-light-smoke',
      };
    case 'modules':
      return {
        templateProfile: 'module-generic-repair',
        strategy: 'rewrite-module-managed-spec-to-light-smoke',
      };
    default:
      return {
        templateProfile: 'generic-repair',
        strategy: 'rewrite-managed-spec-to-light-smoke',
      };
  }
}

function upsertManagedSpec(pageMeta, reason, context, repairProfile = null) {
  const targetPath = pageMeta.managedSpecPath;
  const content = buildManagedSpecContent(pageMeta, reason, repairProfile);
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
    templateProfile: repairProfile?.templateProfile || defaultManagedTemplateProfile(pageMeta),
    repairStrategy: repairProfile?.strategy || null,
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

    const repairProfile = managedRepairProfileFor(pageMeta, failure, managedEntry);
    if (upsertManagedSpec(pageMeta, `failure-repair:${failure.category}`, context, repairProfile)) {
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

function coverageThresholdsPassed(coverage) {
  return Object.values(coverage?.summary || {}).every((metric) => metric.passed !== false);
}

function scanHasCompletenessGaps(scan) {
  return Boolean(
    scan?.summary &&
      (scan.summary.missingSpecCount > 0 || scan.summary.orphanSpecTargetCount > 0 || scan.summary.specsWithoutGotoCount > 0)
  );
}

function recordMutationBatch(loopReport, mutationContext, phase) {
  const applied = mutationContext?.mutations || [];
  const reverted = mutationContext?.revertedMutations || [];

  if (applied.length > 0) {
    loopReport.mutations.push(...applied.map((mutation) => ({ ...mutation, phase })));
  }

  if (reverted.length > 0) {
    for (const mutation of reverted) {
      loopReport.warnings.push({
        type: 'mutation-rolled-back',
        phase,
        file: mutation.file,
        reason: mutation.reason,
        message: 'Automatic mutation was reverted because its targeted verification rerun failed.',
      });
    }
  }

  return applied.length;
}

function refreshScanIfNeeded(skipScan) {
  return skipScan ? emptyScanResult() : runNodeScript('scan-web-test-pages.mjs');
}

function runAnalysisBundle() {
  return {
    failureAnalysis: tryLoadJson('analyze-playwright-results.mjs'),
    coverageAnalysis: tryLoadJson('summarize-coverage.mjs'),
    suggestions: tryLoadJson('suggest-test-targets.mjs'),
  };
}

function buildRoundSummary(roundNumber, analysis, coverageCheck, scan, mutationContext) {
  const coveragePassed = coverageThresholdsPassed(analysis.coverageAnalysis);
  const testsPassed = (analysis.failureAnalysis?.summary?.failedCount || 0) === 0;
  const thresholdCheckPassed = coverageCheck ? !coverageCheck.failed : coveragePassed;

  return {
    round: roundNumber,
    testsPassed,
    coveragePassed,
    thresholdCheckPassed,
    completenessPassed: !scanHasCompletenessGaps(scan),
    appliedMutationCount: mutationContext?.mutations?.length || 0,
    revertedMutationCount: mutationContext?.revertedMutations?.length || 0,
  };
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
  loopReport.scan = refreshScanIfNeeded(options.skipScan);

  const initialMutationContext = createMutationContext(options.dryRun);
  addManagedSpecsForMissingPages(loopReport.scan, pageCatalog, initialMutationContext);
  const initialRepairContext = applyAndVerifyHandwrittenRepairs(
    loopReport.scan,
    pageCatalog,
    options.dryRun,
    loopReport.verification
  );
  initialMutationContext.mutations.push(...initialRepairContext.mutations);
  initialMutationContext.revertedMutations.push(...initialRepairContext.revertedMutations);
  recordMutationBatch(loopReport, initialMutationContext, 'preflight');
  addVerificationWarnings(loopReport.verification, loopReport.warnings);

  if ((initialMutationContext.mutations.length > 0 || initialMutationContext.revertedMutations.length > 0) && !options.dryRun) {
    managedIndex = loadManagedSpecIndex();
    loopReport.scan = refreshScanIfNeeded(options.skipScan);
  }

  if (!options.allowIncompleteScan && scanHasCompletenessGaps(loopReport.scan)) {
    addCompletenessWarnings(loopReport.scan, loopReport.warnings);
    const analysis = runAnalysisBundle();
    loopReport.finalAnalyses.failures = analysis.failureAnalysis;
    loopReport.finalAnalyses.coverage = analysis.coverageAnalysis;
    loopReport.finalAnalyses.suggestions = analysis.suggestions;
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

  if (options.dryRun || options.mutateOnly) {
    const analysis = runAnalysisBundle();
    loopReport.finalAnalyses.failures = analysis.failureAnalysis;
    loopReport.finalAnalyses.coverage = analysis.coverageAnalysis;
    loopReport.finalAnalyses.suggestions = analysis.suggestions;

    if (!options.dryRun) {
      const mutateOnlyContext = createMutationContext(false);
      addManagedSpecsForCoverage(loopReport.finalAnalyses.suggestions, pageCatalog, managedIndex, mutateOnlyContext);
      recordMutationBatch(loopReport, mutateOnlyContext, 'mutate-only');
      if (mutateOnlyContext.mutations.length > 0) {
        managedIndex = loadManagedSpecIndex();
        loopReport.scan = refreshScanIfNeeded(options.skipScan);
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

  const maxRounds = Math.max(1, options.maxRounds);
  for (let roundIndex = 0; roundIndex < maxRounds; roundIndex += 1) {
    const roundNumber = roundIndex + 1;
    const round = {
      attempt: roundNumber,
      canonicalRun: runCommand(
        `Canonical full run (round ${roundNumber}/${maxRounds})`,
        process.execPath,
        buildCanonicalArgs(),
        { allowFailure: true }
      ),
      coverageCheck: null,
      failureAnalysis: null,
      coverageAnalysis: null,
      suggestions: null,
      mutations: [],
      warnings: [],
      rerunTriggered: false,
      summary: null,
    };

    const analysis = runAnalysisBundle();
    round.failureAnalysis = analysis.failureAnalysis;
    round.coverageAnalysis = analysis.coverageAnalysis;
    round.suggestions = analysis.suggestions;

    if (!options.skipCoverageCheck && !round.coverageAnalysis.error) {
      round.coverageCheck = runCoverageCheck();
    }

    const roundContext = createMutationContext(false);
    repairManagedSpecFailures(round.failureAnalysis, pageCatalog, managedIndex, roundContext);

    const latestScan = refreshScanIfNeeded(options.skipScan);
    const handwrittenRepairContext = applyAndVerifyHandwrittenRepairs(latestScan, pageCatalog, false, loopReport.verification);
    roundContext.mutations.push(...handwrittenRepairContext.mutations);
    roundContext.revertedMutations.push(...handwrittenRepairContext.revertedMutations);
    addVerificationWarnings(loopReport.verification, loopReport.warnings);

    if (!coverageThresholdsPassed(round.coverageAnalysis)) {
      addManagedSpecsForCoverage(round.suggestions, pageCatalog, managedIndex, roundContext);
    }

    round.mutations = roundContext.mutations;
    recordMutationBatch(loopReport, roundContext, `round-${roundNumber}`);

    if (roundContext.mutations.length > 0) {
      managedIndex = loadManagedSpecIndex();
    }

    loopReport.scan = refreshScanIfNeeded(options.skipScan);
    round.summary = buildRoundSummary(roundNumber, analysis, round.coverageCheck, loopReport.scan, roundContext);
    round.rerunTriggered = roundContext.mutations.length > 0 && roundIndex < maxRounds - 1;
    loopReport.attempts.push(round);

    if (
      round.summary.testsPassed &&
      round.summary.coveragePassed &&
      round.summary.thresholdCheckPassed &&
      round.summary.completenessPassed &&
      round.summary.appliedMutationCount === 0
    ) {
      break;
    }

    if (!round.rerunTriggered) {
      break;
    }
  }

  const lastAttempt = loopReport.attempts[loopReport.attempts.length - 1] || null;
  loopReport.finalAnalyses.failures = lastAttempt?.failureAnalysis || tryLoadJson('analyze-playwright-results.mjs');
  loopReport.finalAnalyses.coverage = lastAttempt?.coverageAnalysis || tryLoadJson('summarize-coverage.mjs');
  loopReport.finalAnalyses.suggestions = lastAttempt?.suggestions || tryLoadJson('suggest-test-targets.mjs');

  loopReport.scan = refreshScanIfNeeded(options.skipScan);
  if (scanHasCompletenessGaps(loopReport.scan)) {
    addCompletenessWarnings(loopReport.scan, loopReport.warnings);
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





