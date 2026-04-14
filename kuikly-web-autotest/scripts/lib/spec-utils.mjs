import { unique } from './fs-utils.mjs';

export function extractGotoTargets(content) {
  const targets = [];
  const pattern = /kuiklyPage\.goto\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match = pattern.exec(content);
  while (match) {
    targets.push(match[1]);
    match = pattern.exec(content);
  }
  return unique(targets);
}

export function replaceLiteralGotoTarget(content, fromPageName, toPageName) {
  const escapedFrom = fromPageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(kuiklyPage\\.goto\\(\\s*['"])${escapedFrom}(['"]\\s*\\))`, 'g');
  return content.replace(pattern, `$1${toPageName}$2`);
}

export function extractLegacyGotoTarget(content) {
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

export function normalizeLegacyGotoCalls(content, targetPageName) {
  return content
    .replace(/await\s+kuiklyPage\.page\.goto\(\s*['"]\?page_name=[^'"]+['"]\s*\);?/g, `await kuiklyPage.goto('${targetPageName}');`)
    .replace(/await\s+page\.goto\(\s*['"]\?page_name=[^'"]+['"]\s*\);?/g, `await kuiklyPage.goto('${targetPageName}');`);
}
