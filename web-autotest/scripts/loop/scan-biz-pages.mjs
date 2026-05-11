#!/usr/bin/env node

/**
 * scan-biz-pages.mjs
 *
 * Scans a business source directory for all Kotlin pages registered with the
 * @Page annotation. Outputs a JSON array of discovered pages to stdout.
 *
 * Usage:
 *   node scripts/loop/scan-biz-pages.mjs --biz <business_name>
 *   node scripts/loop/scan-biz-pages.mjs --source-dir <path>
 */

import { readFileSync } from 'fs';
import { join, relative } from 'path';
import { createRequire } from 'module';
import { repoRoot, autotestDir } from '../lib/paths.mjs';
import { toPosix, walkFiles } from '../lib/fs-utils.mjs';

// ── CLI argument parsing ─────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--biz' && argv[i + 1]) {
      args.biz = argv[++i];
    } else if (argv[i] === '--source-dir' && argv[i + 1]) {
      args.sourceDir = argv[++i];
    }
  }
  return args;
}

const args = parseArgs(process.argv);

if (!args.biz && !args.sourceDir) {
  console.error('Usage: scan-biz-pages.mjs --biz <name> | --source-dir <path>');
  process.exit(1);
}

// ── Resolve source directory ─────────────────────────────────────────────────

const _require = createRequire(import.meta.url);
const configPath = process.env.KUIKLY_AUTOTEST_CONFIG
  || join(autotestDir, 'kuikly.autotest.config.cjs');
const autotestConfig = _require(configPath);

let sourceDir;

if (args.sourceDir) {
  // Direct path — resolve relative to repoRoot if not absolute
  sourceDir = join(repoRoot, args.sourceDir);
} else {
  // Look up from config.businesses[]
  const businesses = autotestConfig.businesses || [];
  const biz = businesses.find((b) => b.name === args.biz);
  if (!biz) {
    console.error(`Error: business "${args.biz}" not found in config.businesses`);
    console.error('Available businesses: ' + businesses.map((b) => b.name).join(', '));
    process.exit(1);
  }
  if (!biz.sourceDir) {
    console.error(`Error: business "${args.biz}" has no sourceDir configured`);
    process.exit(1);
  }
  sourceDir = join(repoRoot, biz.sourceDir);
}

// ── @Page annotation parsing ─────────────────────────────────────────────────

/**
 * Checks whether a value is a string literal (quoted) or a constant reference.
 * Returns { value, isConstant }.
 */
function parseAnnotationValue(raw) {
  if (!raw) return { value: null, isConstant: false };
  const trimmed = raw.trim();
  // String literal: "xxx"
  const strMatch = trimmed.match(/^"([^"]*)"$/);
  if (strMatch) {
    return { value: strMatch[1], isConstant: false };
  }
  // Constant reference (e.g. BaseConstants.Pages.DETAIL)
  return { value: trimmed, isConstant: true };
}

/**
 * Extract @Page annotation parameters from a source string.
 * Handles various annotation formats:
 *   @Page(name = "xxx", moduleId = "yyy")
 *   @Page("xxx", true, moduleId = "yyy")
 *   @Page("xxx")
 *   @Page(name = SomeConst, moduleId = AnotherConst)
 */
function extractPageAnnotation(source) {
  // Match @Page(...) — capture the content inside parentheses.
  const annotationRegex = /@Page\s*\(([\s\S]*?)\)/g;
  const results = [];

  let match;
  while ((match = annotationRegex.exec(source)) !== null) {
    const paramsStr = match[1].trim();
    if (!paramsStr) continue;

    let pageName = null;
    let pageNameIsConstant = false;
    let moduleId = null;
    let moduleIdIsConstant = false;

    // Try to extract named parameter: name = ...
    const nameParamMatch = paramsStr.match(/\bname\s*=\s*("(?:[^"\\]|\\.)*"|[A-Za-z_][A-Za-z0-9_.]*)/);
    if (nameParamMatch) {
      const parsed = parseAnnotationValue(nameParamMatch[1]);
      pageName = parsed.value;
      pageNameIsConstant = parsed.isConstant;
    }

    // Try to extract named parameter: moduleId = ...
    const moduleIdParamMatch = paramsStr.match(/\bmoduleId\s*=\s*("(?:[^"\\]|\\.)*"|[A-Za-z_][A-Za-z0-9_.]*)/);
    if (moduleIdParamMatch) {
      const parsed = parseAnnotationValue(moduleIdParamMatch[1]);
      moduleId = parsed.value;
      moduleIdIsConstant = parsed.isConstant;
    }

    // If name was not found via named param, try positional first argument
    if (pageName === null) {
      // Split by commas but respect quoted strings
      const positionalArgs = splitAnnotationArgs(paramsStr);
      if (positionalArgs.length > 0) {
        const firstArg = positionalArgs[0].trim();
        // Skip if it's a named param (contains '=')
        if (!firstArg.includes('=')) {
          const parsed = parseAnnotationValue(firstArg);
          pageName = parsed.value;
          pageNameIsConstant = parsed.isConstant;
        }
      }
    }

    if (pageName !== null) {
      results.push({
        pageName,
        pageNameIsConstant,
        moduleId,
        moduleIdIsConstant,
        annotationIndex: match.index,
      });
    }
  }

  return results;
}

/**
 * Split annotation arguments by comma, respecting quoted strings.
 */
function splitAnnotationArgs(str) {
  const args = [];
  let current = '';
  let inQuote = false;
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' && (i === 0 || str[i - 1] !== '\\')) {
      inQuote = !inQuote;
      current += ch;
    } else if (!inQuote && ch === '(') {
      depth++;
      current += ch;
    } else if (!inQuote && ch === ')') {
      depth--;
      current += ch;
    } else if (!inQuote && depth === 0 && ch === ',') {
      args.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current);
  return args;
}

/**
 * Extract the class name that follows the @Page annotation.
 */
function extractClassName(source, annotationIndex) {
  // Look for `class ClassName` after the annotation
  const afterAnnotation = source.slice(annotationIndex);
  const classMatch = afterAnnotation.match(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/);
  return classMatch ? classMatch[1] : null;
}

// ── Main scan ────────────────────────────────────────────────────────────────

const ktFiles = walkFiles(sourceDir, (filePath) => filePath.endsWith('.kt'));

const pages = [];

for (const filePath of ktFiles) {
  const source = readFileSync(filePath, 'utf8');
  const annotations = extractPageAnnotation(source);

  for (const ann of annotations) {
    const className = extractClassName(source, ann.annotationIndex);
    if (!className) continue;

    pages.push({
      pageName: ann.pageName,
      moduleId: ann.moduleId,
      className,
      sourceFile: toPosix(relative(repoRoot, filePath)),
      pageNameIsConstant: ann.pageNameIsConstant,
      moduleIdIsConstant: ann.moduleIdIsConstant,
    });
  }
}

// ── Output ───────────────────────────────────────────────────────────────────

console.log(JSON.stringify(pages, null, 2));
