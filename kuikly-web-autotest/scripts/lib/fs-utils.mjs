import { existsSync, readdirSync } from 'fs';
import { join, sep } from 'path';

export function toPosix(filePath) {
  return filePath.split(sep).join('/');
}

export function walkFiles(root, predicate) {
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

export function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}
