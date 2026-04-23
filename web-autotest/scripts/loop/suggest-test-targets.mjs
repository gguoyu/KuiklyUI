#!/usr/bin/env node

import { relative } from 'path';
import { computeFileMetrics } from '../lib/coverage-utils.mjs';
import { displayConfig } from '../lib/config.mjs';
import { toPosix, unique } from '../lib/fs-utils.mjs';
import { requireJsonFile } from '../lib/json-io.mjs';
import { coveragePath, repoRoot } from '../lib/paths.mjs';
import { runSiblingScriptJson } from '../lib/script-runner.mjs';

const coverage = requireJsonFile(
  coveragePath,
  `Missing coverage report: ${coveragePath}`,
  'Failed to parse coverage report'
);
const scan = runSiblingScriptJson('scan-web-test-pages.mjs');

const pageList = scan.pages || [];
const pageNames = pageList.map((page) => page.pageName);

function componentSpecCandidates(filePath) {
  const basename = filePath.split('/').pop() || '';
  const normalized = basename.replace(/\.kt$/, '');

  const candidates = [];

  const pageByExactName = pageNames.find((pageName) => {
    const token = pageName.replace(/TestPage$/, '').toLowerCase();
    return token && normalized.toLowerCase().includes(token.toLowerCase());
  });
  if (pageByExactName) {
    candidates.push(pageByExactName);
  }

  if (/module/i.test(normalized)) {
    const moduleName = normalized.replace(/^KR/, '').replace(/Module.*$/, '').toLowerCase();
    for (const pageName of pageNames.filter((name) => /ModuleTestPage$/.test(name))) {
      if (pageName.toLowerCase().includes(moduleName)) {
        candidates.push(pageName);
      }
    }
  }

  if (/event|gesture|animation|list|scroll|router|windowresize|image|richtext|video|hover|blur/i.test(normalized)) {
    for (const pageName of pageNames) {
      const loweredPage = pageName.toLowerCase();
      if (normalized.toLowerCase().includes('event') && loweredPage.includes('event')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('gesture') && loweredPage.includes('gesture')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('animation') && loweredPage.includes('anim')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('list') && loweredPage.includes('list')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('scroll') && loweredPage.includes('scroll')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('image') && loweredPage.includes('image')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('richtext') && loweredPage.includes('richtext')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('video') && loweredPage.includes('video')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('hover') && loweredPage.includes('hover')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('blur') && loweredPage.includes('blur')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('router') && loweredPage.includes('navigation')) candidates.push(pageName);
      if (normalized.toLowerCase().includes('windowresize') && loweredPage.includes('view')) candidates.push(pageName);
    }
  }

  return unique(candidates);
}

const suggestions = Object.entries(coverage)
  .map(([absolutePath, info]) => {
    const file = toPosix(relative(repoRoot, absolutePath));
    const metrics = computeFileMetrics(info);
    const suggestedPages = componentSpecCandidates(file);
    return {
      file,
      metrics,
      uncoveredWeight:
        (metrics.branches.total - metrics.branches.covered) * 3 +
        (metrics.lines.total - metrics.lines.covered) * 2 +
        (metrics.statements.total - metrics.statements.covered),
      suggestedPages,
      existingSpecs: scan.specTargets
        .filter((spec) => spec.targets.some((target) => suggestedPages.includes(target)))
        .map((spec) => spec.file),
    };
  })
  .filter((item) => item.uncoveredWeight > 0)
  .sort((left, right) => right.uncoveredWeight - left.uncoveredWeight)
  .slice(0, displayConfig.maxSuggestions);

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  suggestions,
}, null, 2));
