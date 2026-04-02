#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, relative, sep } from 'path';

const repoRoot = process.cwd();
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

function walkFiles(root, predicate) {
  const results = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!existsSync(current)) {
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

function toPosix(filePath) {
  return filePath.split(sep).join('/');
}

function extractGotoTargets(content) {
  const targets = [];
  const pattern = /kuiklyPage\.goto\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match = pattern.exec(content);
  while (match) {
    targets.push(match[1]);
    match = pattern.exec(content);
  }
  return [...new Set(targets)];
}

const pageFiles = walkFiles(webTestRoot, (filePath) => filePath.endsWith('.kt'));
const specFiles = walkFiles(testsRoot, (filePath) => filePath.endsWith('.spec.ts'));

const pages = pageFiles.map((filePath) => {
  const pageName = filePath.slice(filePath.lastIndexOf(sep) + 1).replace(/\.kt$/, '');
  return {
    pageName,
    file: toPosix(relative(repoRoot, filePath)),
    category: toPosix(relative(webTestRoot, filePath)).split('/')[0] || 'root',
  };
});

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
