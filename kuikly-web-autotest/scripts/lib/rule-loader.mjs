import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { repoRoot } from './paths.mjs';

const rulesRoot = join(repoRoot, 'kuikly-web-autotest', 'rules');

const fallbackTemplateProfiles = Object.freeze({
  categoryDefaults: Object.freeze({
    default: 'default',
    interactions: 'interaction-generic',
    animations: 'animation-generic',
    modules: 'module-generic',
  }),
  categoryRepairDefaults: Object.freeze({
    default: Object.freeze({ templateProfile: 'generic-repair', strategy: 'rewrite-managed-spec-to-light-smoke' }),
    interactions: Object.freeze({ templateProfile: 'interaction-generic-repair', strategy: 'rewrite-interaction-managed-spec-to-light-smoke' }),
    animations: Object.freeze({ templateProfile: 'animation-generic-repair', strategy: 'rewrite-animation-managed-spec-to-light-smoke' }),
    modules: Object.freeze({ templateProfile: 'module-generic-repair', strategy: 'rewrite-module-managed-spec-to-light-smoke' }),
  }),
  pageProfiles: Object.freeze({}),
});

const fallbackInteractionProtocol = Object.freeze({
  defaults: Object.freeze({
    actions: Object.freeze(['click-visible-labels']),
    actionScripts: Object.freeze([]),
    maxActionLabels: 4,
    postActionWaitMs: 250,
    recheckPageReadyAfterAction: true,
    scrollDeltaY: 520,
    inputText: 'Hello Kuikly',
  }),
  categoryProfiles: Object.freeze({
    default: Object.freeze({ actions: Object.freeze(['click-visible-labels']), actionScripts: Object.freeze([]) }),
  }),
  componentProfiles: Object.freeze({}),
  pageProfiles: Object.freeze({}),
});

const fallbackAnimationStrategy = Object.freeze({
  defaults: Object.freeze({
    genericTemplateProfile: 'default',
    repairTemplateProfile: 'animation-generic-repair',
    preferredWait: 'waitForAnimationEnd',
    fallbackWaitMs: 900,
    ciFallbackWaitMs: 1200,
    preferStateAssertions: true,
  }),
  pageProfiles: Object.freeze({}),
});

const fallbackReviewChecklist = Object.freeze({
  globalRequiredSnippets: Object.freeze([
    'await kuiklyPage.waitForRenderComplete()',
  ]),
  classificationRules: Object.freeze({}),
  antiPatterns: Object.freeze([]),
});

const cache = new Map();

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function mergeUniqueArray(left = [], right = []) {
  const values = [...left, ...right];
  return values.filter((value, index) => values.indexOf(value) === index);
}

function deepMerge(base, extra) {
  if (Array.isArray(base) || Array.isArray(extra)) {
    return mergeUniqueArray(Array.isArray(base) ? base : [], Array.isArray(extra) ? extra : []);
  }

  if (!isPlainObject(base) || !isPlainObject(extra)) {
    return extra == null ? base : extra;
  }

  const merged = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (key in merged) {
      merged[key] = deepMerge(merged[key], value);
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

function loadRuleFile(fileName, fallbackValue) {
  if (cache.has(fileName)) {
    return cache.get(fileName);
  }

  const filePath = join(rulesRoot, fileName);
  if (!existsSync(filePath)) {
    cache.set(fileName, fallbackValue);
    return fallbackValue;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    const merged = deepMerge(fallbackValue, parsed);
    cache.set(fileName, merged);
    return merged;
  } catch (error) {
    console.warn(`[autotest] Failed to load rule file ${fileName}: ${error.message}`);
    cache.set(fileName, fallbackValue);
    return fallbackValue;
  }
}

export function getTemplateProfileRules() {
  return loadRuleFile('template-profiles.json', fallbackTemplateProfiles);
}

export function getInteractionProtocolRules() {
  return loadRuleFile('interaction-protocol.json', fallbackInteractionProtocol);
}

export function getAnimationStrategyRules() {
  return loadRuleFile('animation-strategy.json', fallbackAnimationStrategy);
}

export function getReviewChecklistRules() {
  return loadRuleFile('review-checklist.json', fallbackReviewChecklist);
}

export function resolveManagedTemplateProfile(pageMeta = {}) {
  const rules = getTemplateProfileRules();
  return rules.pageProfiles?.[pageMeta.pageName]?.defaultTemplateProfile
    || rules.categoryDefaults?.[pageMeta.category]
    || rules.categoryDefaults?.default
    || 'default';
}

function messageMatchesAny(message, markers = []) {
  if (!markers.length) {
    return true;
  }

  return markers.some((marker) => message.includes(String(marker).toLowerCase()));
}

function repairRuleMatches(rule = {}, currentTemplateProfile, failure) {
  const match = rule.match || {};
  const message = `${failure?.message || ''}\n${failure?.stack || ''}`.toLowerCase();

  if (Array.isArray(match.currentTemplateProfiles) && match.currentTemplateProfiles.length > 0
    && !match.currentTemplateProfiles.includes(currentTemplateProfile)) {
    return false;
  }

  if (Array.isArray(match.failureCategories) && match.failureCategories.length > 0
    && !match.failureCategories.includes(failure?.category)) {
    return false;
  }

  if (Array.isArray(match.messageIncludes) && match.messageIncludes.length > 0
    && !messageMatchesAny(message, match.messageIncludes)) {
    return false;
  }

  return true;
}

export function resolveManagedRepairProfile(pageMeta = {}, failure, managedEntry) {
  const rules = getTemplateProfileRules();
  const currentTemplateProfile = managedEntry?.metadata?.templateProfile || resolveManagedTemplateProfile(pageMeta);
  const pageRepairProfiles = rules.pageProfiles?.[pageMeta.pageName]?.repairProfiles || [];

  for (const rule of pageRepairProfiles) {
    if (!repairRuleMatches(rule, currentTemplateProfile, failure)) {
      continue;
    }

    return {
      templateProfile: rule.templateProfile || currentTemplateProfile,
      strategy: rule.strategy || 'reuse-current-template',
    };
  }

  const fallbackRepair = rules.categoryRepairDefaults?.[pageMeta.category] || rules.categoryRepairDefaults?.default;
  return {
    templateProfile: fallbackRepair?.templateProfile || 'generic-repair',
    strategy: fallbackRepair?.strategy || 'rewrite-managed-spec-to-light-smoke',
  };
}

function normalizeResolvedInteractionConfig(config) {
  return {
    actions: mergeUniqueArray([], Array.isArray(config.actions) ? config.actions : []),
    actionScripts: Array.isArray(config.actionScripts) ? config.actionScripts : [],
    maxActionLabels: Number(config.maxActionLabels) > 0 ? Number(config.maxActionLabels) : fallbackInteractionProtocol.defaults.maxActionLabels,
    postActionWaitMs: Number(config.postActionWaitMs) > 0 ? Number(config.postActionWaitMs) : fallbackInteractionProtocol.defaults.postActionWaitMs,
    recheckPageReadyAfterAction: config.recheckPageReadyAfterAction !== false,
    scrollDeltaY: Number(config.scrollDeltaY) > 0 ? Number(config.scrollDeltaY) : fallbackInteractionProtocol.defaults.scrollDeltaY,
    inputText: typeof config.inputText === 'string' && config.inputText.trim()
      ? config.inputText
      : fallbackInteractionProtocol.defaults.inputText,
  };
}

export function resolveInteractionHints(pageMeta = {}) {
  const rules = getInteractionProtocolRules();
  let resolved = deepMerge({}, rules.defaults || {});
  resolved = deepMerge(resolved, rules.categoryProfiles?.default || {});
  resolved = deepMerge(resolved, rules.categoryProfiles?.[pageMeta.category] || {});

  for (const componentType of pageMeta.componentTypes || []) {
    resolved = deepMerge(resolved, rules.componentProfiles?.[componentType] || {});
  }

  resolved = deepMerge(resolved, rules.pageProfiles?.[pageMeta.pageName] || {});
  return normalizeResolvedInteractionConfig(resolved);
}

export function resolveAnimationHints(pageMeta = {}) {
  const rules = getAnimationStrategyRules();
  const resolved = deepMerge(rules.defaults || {}, rules.pageProfiles?.[pageMeta.pageName] || {});

  return {
    preferredWait: typeof resolved.preferredWait === 'string' ? resolved.preferredWait : fallbackAnimationStrategy.defaults.preferredWait,
    fallbackWaitMs: Number(resolved.fallbackWaitMs) > 0 ? Number(resolved.fallbackWaitMs) : fallbackAnimationStrategy.defaults.fallbackWaitMs,
    ciFallbackWaitMs: Number(resolved.ciFallbackWaitMs) > 0 ? Number(resolved.ciFallbackWaitMs) : fallbackAnimationStrategy.defaults.ciFallbackWaitMs,
    preferStateAssertions: resolved.preferStateAssertions !== false,
    repairTemplateProfile: typeof resolved.repairTemplateProfile === 'string' ? resolved.repairTemplateProfile : fallbackAnimationStrategy.defaults.repairTemplateProfile,
    genericTemplateProfile: typeof resolved.genericTemplateProfile === 'string' ? resolved.genericTemplateProfile : fallbackAnimationStrategy.defaults.genericTemplateProfile,
  };
}

function countExpectCalls(content) {
  return (content.match(/\bexpect\s*\(/g) || []).length;
}

function hasUsableInteractionPath(actionLabels = [], interactionHints = {}) {
  if (Array.isArray(interactionHints.actionScripts) && interactionHints.actionScripts.length > 0) {
    return true;
  }

  const actions = Array.isArray(interactionHints.actions) ? interactionHints.actions : [];
  if (actions.some((action) => action === 'fill-first-input' || action === 'scroll-first-list')) {
    return true;
  }

  return actions.includes('click-visible-labels') && Array.isArray(actionLabels) && actionLabels.length > 0;
}

export function validateGeneratedSpec({ content = '', targetClassification = 'functional', actionLabels = [], interactionHints = {} } = {}) {
  const rules = getReviewChecklistRules();
  const warnings = [];

  for (const snippet of rules.globalRequiredSnippets || []) {
    if (!content.includes(snippet)) {
      warnings.push({
        id: `missing-global-snippet:${snippet}`,
        message: `Generated spec is missing required snippet: ${snippet}`,
      });
    }
  }

  const classificationRule = rules.classificationRules?.[targetClassification];
  if (classificationRule) {
    if (Array.isArray(classificationRule.requiredOneOf) && classificationRule.requiredOneOf.length > 0
      && !classificationRule.requiredOneOf.some((snippet) => content.includes(snippet))) {
      warnings.push({
        id: `missing-${targetClassification}-signal`,
        message: `Generated spec is missing a ${targetClassification} assertion or action signal.`,
      });
    }

    if (Array.isArray(classificationRule.requiredAlso) && classificationRule.requiredAlso.length > 0
      && !classificationRule.requiredAlso.every((snippet) => content.includes(snippet))) {
      warnings.push({
        id: `missing-${targetClassification}-required`,
        message: `Generated spec is missing required ${targetClassification} snippets.`,
      });
    }

    if (Number(classificationRule.minimumExpectCount) > 0
      && countExpectCalls(content) < Number(classificationRule.minimumExpectCount)) {
      warnings.push({
        id: `expect-count-${targetClassification}`,
        message: `Generated spec has fewer expect() assertions than required for ${targetClassification}.`,
      });
    }

    if (classificationRule.requireActionableInteractionPath === true
      && !hasUsableInteractionPath(actionLabels, interactionHints)) {
      warnings.push({
        id: 'missing-actionable-interaction-path',
        message: 'Generated interaction spec does not have a usable action path from extracted labels or scripted interaction rules.',
      });
    }
  }

  for (const antiPattern of rules.antiPatterns || []) {
    const includesSatisfied = !Array.isArray(antiPattern.includes)
      || antiPattern.includes.every((snippet) => content.includes(snippet));
    if (!includesSatisfied) {
      continue;
    }

    if (Array.isArray(antiPattern.requiresOneOf) && antiPattern.requiresOneOf.some((snippet) => content.includes(snippet))) {
      continue;
    }

    if (antiPattern.pattern) {
      const regex = new RegExp(antiPattern.pattern, 'u');
      if (!regex.test(content)) {
        continue;
      }
    }

    warnings.push({
      id: antiPattern.id || 'review-check-warning',
      message: antiPattern.message || 'Generated spec matched a review checklist warning.',
    });
  }

  return warnings;
}
