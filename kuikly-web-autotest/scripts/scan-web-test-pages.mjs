#!/usr/bin/env node

import { readFileSync } from 'fs';
import { relative } from 'path';
import { repoRoot, testsRoot, webTestRoot } from './lib/paths.mjs';
import { toPosix, walkFiles } from './lib/fs-utils.mjs';
import { extractGotoTargets } from './lib/spec-utils.mjs';

const pageFiles = walkFiles(webTestRoot, (filePath) => filePath.endsWith('.kt'));
const specFiles = walkFiles(testsRoot, (filePath) => filePath.endsWith('.spec.ts'));

const pages = pageFiles.map((filePath) => ({
  pageName: filePath.slice(filePath.lastIndexOf('/') + 1).replace(/\.kt$/, '').split('\\').pop(),
  file: toPosix(relative(repoRoot, filePath)),
  category: toPosix(relative(webTestRoot, filePath)).split('/')[0] || 'root',
}));

const pageMap = new Map(pages.map((page) => [page.pageName, page]));
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
for (const { file, targets } of specTargets) {
  for (const target of targets) {
    if (!pageMap.has(target)) {
      orphanSpecTargets.push({ spec: file, pageName: target });
    }
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
    specsWithoutGotoCount: specsWithoutGoto.length,
  },
  pages,
  specTargets,
  missingSpecs,
  orphanSpecTargets,
  specsWithoutGoto,
  multiMappedPages,
};

console.log(JSON.stringify(result, null, 2));
