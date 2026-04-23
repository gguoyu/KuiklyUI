#!/usr/bin/env node

import { readFileSync } from 'fs';
import { basename, dirname, relative } from 'path';
import { repoRoot, testsRoot, webTestRoot } from '../lib/paths.mjs';
import { toPosix, walkFiles } from '../lib/fs-utils.mjs';
import { extractGotoTargets } from '../lib/spec-utils.mjs';

const demoPagesRoot = dirname(webTestRoot);
const pageFiles = walkFiles(webTestRoot, (filePath) => filePath.endsWith('.kt'));
const allPageFiles = walkFiles(demoPagesRoot, (filePath) => filePath.endsWith('.kt'));
const specFiles = walkFiles(testsRoot, (filePath) => filePath.endsWith('.spec.ts'));

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
  },
  pages,
  specTargets,
  missingSpecs,
  orphanSpecTargets,
  nonWebTestSpecTargets,
  specsWithoutGoto,
  multiMappedPages,
  violations: {
    orphanSpecTargets,
    nonWebTestSpecTargets,
    specsWithoutGoto,
  },
};

console.log(JSON.stringify(result, null, 2));
