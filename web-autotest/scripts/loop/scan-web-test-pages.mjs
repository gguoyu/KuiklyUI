#!/usr/bin/env node

import { readFileSync } from 'fs';
import { basename, dirname, join, relative } from 'path';
import { createRequire } from 'module';
import { repoRoot, testsRoot, webTestRoot } from '../lib/paths.mjs';
import { toPosix, walkFiles } from '../lib/fs-utils.mjs';
import { extractGotoTargets } from '../lib/spec-utils.mjs';

const require = createRequire(import.meta.url);
const autotestConfig = require(join(repoRoot, 'web-autotest', 'kuikly.autotest.config.cjs'));

const demoPagesRoot = dirname(webTestRoot);
const pageFiles = walkFiles(webTestRoot, (filePath) => filePath.endsWith('.kt'));
const allPageFiles = walkFiles(demoPagesRoot, (filePath) => filePath.endsWith('.kt'));
const specFiles = walkFiles(testsRoot, (filePath) => filePath.endsWith('.spec.ts'));

// ---------------------------------------------------------------------------
// Source-file reverse mapping (C2 new capability)
// ---------------------------------------------------------------------------

/**
 * Build a set of "subject names" that already have a web_test carrier page.
 * e.g. "KRImageViewTestPage" → subject "KRImageView"
 * We normalise by stripping "TestPage" suffix (case-insensitive).
 */
function coveredSubjectNames(pages) {
  return new Set(
    pages.map((p) => p.pageName.replace(/TestPage$/i, '').toLowerCase())
  );
}

/**
 * For each Kotlin file under sourceRoots, check whether a web_test carrier
 * page already covers it. A source file is considered covered when:
 *   - its class name (without extension) appears as a substring of a known page name, OR
 *   - a page name (minus "TestPage") appears as a substring of the file name
 *
 * Returns the list of source files that have NO matching carrier page.
 */
function findSourceFilesWithoutPage(sourceRoots, covered) {
  const result = [];

  for (const sourceRoot of sourceRoots) {
    const absRoot = join(repoRoot, sourceRoot);
    const ktFiles = walkFiles(absRoot, (fp) => fp.endsWith('.kt'));

    for (const filePath of ktFiles) {
      const fileName = basename(filePath, '.kt').toLowerCase();

      // Skip non-component/module files (utility classes, constants, etc.)
      if (!isTestableSourceFile(filePath)) continue;

      // Check if any covered subject name appears in this file name,
      // or this file name appears in any covered subject name.
      const isCovered = [...covered].some((subject) => {
        if (!subject) return false;
        return fileName.includes(subject) || subject.includes(fileName);
      });

      if (!isCovered) {
        result.push({
          file: toPosix(relative(repoRoot, filePath)),
          fileName: basename(filePath, '.kt'),
          sourceRoot: toPosix(relative(repoRoot, absRoot)),
          suggestedPageName: suggestPageName(basename(filePath, '.kt')),
          suggestedCategory: suggestCategory(filePath, readFileSync(filePath, 'utf8')),
        });
      }
    }
  }

  return result;
}

/**
 * Heuristic: only analyse files that are likely to be components or modules,
 * not internal utilities, constants, or infrastructure files.
 */
function isTestableSourceFile(filePath) {
  const name = basename(filePath, '.kt').toLowerCase();

  // Skip obvious non-component files
  const skipPatterns = [
    /const$/i, /consts$/i, /utils?$/i, /helper$/i, /ext$/i,
    /ktx$/i, /extension$/i, /annotation$/i, /interface$/i,
    /^index$/i, /^base$/i, /^abstract$/i,
  ];
  if (skipPatterns.some((p) => p.test(name))) return false;

  // Skip files in certain subdirectories
  const posixPath = toPosix(filePath).toLowerCase();
  const skipDirs = ['/const/', '/nvi/', '/scheduler/', '/runtime/dom/', '/utils/', '/adapter/', '/ktx/', '/export/'];
  if (skipDirs.some((d) => posixPath.includes(d))) return false;

  // Must look like a class (PascalCase with meaningful length)
  return /^[A-Z][a-z]/.test(basename(filePath, '.kt')) && basename(filePath, '.kt').length > 4;
}

/**
 * Suggest a web_test page name from a source file name.
 * e.g. "KRImageView" → "KRImageViewTestPage"
 *      "KRNotifyModule" → "NotifyModuleTestPage"  (strip KR prefix for modules)
 */
function suggestPageName(sourceFileName) {
  if (/Module$/.test(sourceFileName)) {
    // Strip KR prefix for modules: KRNotifyModule → NotifyModuleTestPage
    return sourceFileName.replace(/^KR/, '') + 'TestPage';
  }
  return sourceFileName + 'TestPage';
}

/**
 * Infer the web_test category from the file path and source content.
 */
function suggestCategory(filePath, source) {
  const posixPath = toPosix(filePath).toLowerCase();

  if (/\/module\//.test(posixPath) || /Module\.kt$/.test(filePath)) return 'modules';
  if (/list|scroll/i.test(basename(filePath))) return 'interactions';
  if (/anim|transition/i.test(basename(filePath))) return 'animations';

  // Check source for event handlers → interactions
  if (/click|longPress|doubleClick|pan\b/i.test(source)) return 'interactions';

  return 'components';
}

// ---------------------------------------------------------------------------
// Existing logic (unchanged)
// ---------------------------------------------------------------------------

function resolvePageName(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const annotationMatch = source.match(/@Page\("([^"]+)"/);
  return annotationMatch?.[1] || basename(filePath, '.kt');
}

function createPageEntry(filePath, rootPath) {
  return {
    pageName: resolvePageName(filePath),
    file: toPosix(relative(repoRoot, filePath)),
    category: toPosix(relative(rootPath, filePath)).split('/')[0] || 'root',
  };
}

const pages = pageFiles.map((filePath) => createPageEntry(filePath, webTestRoot));
const allPages = allPageFiles.map((filePath) => createPageEntry(filePath, demoPagesRoot));
const pageMap = new Map(pages.map((page) => [page.pageName, page]));
const allPagesByName = new Map();
for (const page of allPages) {
  if (!allPagesByName.has(page.pageName)) {
    allPagesByName.set(page.pageName, []);
  }
  allPagesByName.get(page.pageName).push(page);
}

const specTargets = [];

for (const specFile of specFiles) {
  const content = readFileSync(specFile, 'utf8');
  const targets = extractGotoTargets(content);
  specTargets.push({
    file: toPosix(relative(repoRoot, specFile)),
    targets,
  });
}

const specFilesByPage = new Map();
for (const { file, targets } of specTargets) {
  for (const target of targets) {
    if (!specFilesByPage.has(target)) {
      specFilesByPage.set(target, []);
    }
    specFilesByPage.get(target).push(file);
  }
}

const missingSpecs = pages
  .filter((page) => !specFilesByPage.has(page.pageName))
  .map((page) => ({ pageName: page.pageName, category: page.category, file: page.file }));

const orphanSpecTargets = [];
const nonWebTestSpecTargets = [];
for (const { file, targets } of specTargets) {
  for (const target of targets) {
    if (pageMap.has(target)) {
      continue;
    }

    const knownPages = allPagesByName.get(target) || [];
    if (knownPages.length > 0) {
      nonWebTestSpecTargets.push({
        spec: file,
        pageName: target,
        matches: knownPages.map((page) => ({
          file: page.file,
          category: page.category,
        })),
      });
      continue;
    }

    orphanSpecTargets.push({ spec: file, pageName: target });
  }
}

const specsWithoutGoto = specTargets.filter((item) => item.targets.length === 0).map((item) => item.file);

const multiMappedPages = pages
  .map((page) => ({
    pageName: page.pageName,
    category: page.category,
    specs: specFilesByPage.get(page.pageName) || [],
  }))
  .filter((item) => item.specs.length > 1);

// ---------------------------------------------------------------------------
// C2: Source files without carrier page
// ---------------------------------------------------------------------------

const sourceRoots = autotestConfig.sourceRoots || [];
const covered = coveredSubjectNames(pages);
const rawSourceFilesWithoutPage = sourceRoots.length > 0
  ? findSourceFilesWithoutPage(sourceRoots, covered)
  : [];

// Deduplicate by suggestedPageName — keep first occurrence (base layer takes priority)
const seenPageNames = new Set();
const sourceFilesWithoutPage = rawSourceFilesWithoutPage.filter((entry) => {
  if (seenPageNames.has(entry.suggestedPageName)) return false;
  seenPageNames.add(entry.suggestedPageName);
  return true;
});

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const result = {
  generatedAt: new Date().toISOString(),
  webTestRoot: toPosix(relative(repoRoot, webTestRoot)),
  testsRoot: toPosix(relative(repoRoot, testsRoot)),
  summary: {
    pageCount: pages.length,
    specCount: specFiles.length,
    missingSpecCount: missingSpecs.length,
    orphanSpecTargetCount: orphanSpecTargets.length,
    nonWebTestSpecTargetCount: nonWebTestSpecTargets.length,
    specsWithoutGotoCount: specsWithoutGoto.length,
    pagePolicyViolationCount: orphanSpecTargets.length + nonWebTestSpecTargets.length + specsWithoutGoto.length,
    strictPagePolicyPassed: orphanSpecTargets.length === 0 && nonWebTestSpecTargets.length === 0 && specsWithoutGoto.length === 0,
    sourceFilesWithoutPageCount: sourceFilesWithoutPage.length,
  },
  pages,
  specTargets,
  missingSpecs,
  orphanSpecTargets,
  nonWebTestSpecTargets,
  specsWithoutGoto,
  multiMappedPages,
  sourceFilesWithoutPage,
  violations: {
    orphanSpecTargets,
    nonWebTestSpecTargets,
    specsWithoutGoto,
  },
};

console.log(JSON.stringify(result, null, 2));
