import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { detectClassificationUpgradeOpportunity } from './classification-policy.mjs';
import { repoRoot } from './paths.mjs';

const rulesRoot = join(repoRoot, 'web-autotest', 'rules');
const projectRulesRoot = join(repoRoot, 'web-autotest', 'project-rules');

const fallbackTemplateProfiles = Object.freeze({
  categoryDefaults: Object.freeze({
    default: 'default',
    interactions: 'interaction-generic',
    animations: 'animation-generic',
    modules: 'module-generic',
    composite: 'default',
  }),
  categoryRepairDefaults: Object.freeze({
    default: Object.freeze({ templateProfile: 'generic-repair', strategy: 'rewrite-managed-spec-to-light-smoke' }),
    interactions: Object.freeze({ templateProfile: 'interaction-generic-repair', strategy: 'rewrite-interaction-managed-spec-to-light-smoke' }),
    animations: Object.freeze({ templateProfile: 'animation-generic-repair', strategy: 'rewrite-animation-managed-spec-to-light-smoke' }),
    modules: Object.freeze({ templateProfile: 'module-generic-repair', strategy: 'rewrite-module-managed-spec-to-light-smoke' }),
    composite: Object.freeze({ templateProfile: 'generic-repair', strategy: 'rewrite-composite-managed-spec-to-light-smoke' }),
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
  classificationUpgradeRules: Object.freeze({}),
  antiPatterns: Object.freeze([]),
});

const fallbackPriorityMatrix = Object.freeze({
  categoryWeights: Object.freeze({
    interactions: 50,
    modules: 40,
    animations: 30,
    composite: 20,
    components: 10,
    styles: 10,
    default: 0,
  }),
  coverageWeight: 1,
  completenessBonus: 45,
  missingManagedSpecBonus: 12,
  stableOracleBonus: 8,
  statefulActionBonus: 12,
  actionScriptBonus: 14,
  existingManagedPenalty: 8,
  knownFlakyPenalty: 30,
  testabilityBlockPenalty: 1000,
  blockerPenalty: 1000,
});

const fallbackTestabilityRules = Object.freeze({
  minimumStableSignals: 1,
  minimumActionLabelsForClickOnly: 1,
  categoriesRequiringActionablePath: Object.freeze(['interactions', 'modules', 'animations', 'composite']),
  categoriesRequiringObservableOutcome: Object.freeze(['interactions', 'modules', 'animations', 'composite']),
  knownFlakyPages: Object.freeze([]),
  hardBlockers: Object.freeze([]),
});

const fallbackRepairLadder = Object.freeze({
  maxRepairSteps: 3,
  stepOrder: Object.freeze({
    default: Object.freeze(['page-specific', 'category-generic', 'generic-smoke']),
    interactions: Object.freeze(['page-specific', 'category-generic', 'generic-smoke']),
    animations: Object.freeze(['page-specific', 'category-generic', 'generic-smoke']),
    modules: Object.freeze(['page-specific', 'category-generic', 'generic-smoke']),
    composite: Object.freeze(['page-specific', 'category-generic', 'generic-smoke']),
  }),
  genericSmokeTemplateProfile: 'generic-repair',
  genericSmokeStrategy: 'rewrite-managed-spec-to-light-smoke',
});

const fallbackAntiExamples = Object.freeze({
  patternRules: Object.freeze([]),
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

  // Layer 1: framework defaults (fallbackValue)
  // Layer 2: web-autotest/rules/ — framework-level generic rules
  const frameworkPath = join(rulesRoot, fileName);
  let merged = fallbackValue;
  if (existsSync(frameworkPath)) {
    try {
      const parsed = JSON.parse(readFileSync(frameworkPath, 'utf8'));
      merged = deepMerge(merged, parsed);
    } catch (error) {
      console.warn(`[autotest] Failed to load rule file ${fileName}: ${error.message}`);
    }
  }

  // Layer 3: web-autotest/project-rules/ — project-specific overrides (page profiles etc.)
  const projectPath = join(projectRulesRoot, fileName);
  if (existsSync(projectPath)) {
    try {
      const parsed = JSON.parse(readFileSync(projectPath, 'utf8'));
      merged = deepMerge(merged, parsed);
    } catch (error) {
      console.warn(`[autotest] Failed to load project rule file ${fileName}: ${error.message}`);
    }
  }

  cache.set(fileName, merged);
  return merged;
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

export function getPriorityMatrixRules() {
  return loadRuleFile('priority-matrix.json', fallbackPriorityMatrix);
}

export function getTestabilityRules() {
  return loadRuleFile('testability-rules.json', fallbackTestabilityRules);
}

export function getRepairLadderRules() {
  return loadRuleFile('repair-ladder.json', fallbackRepairLadder);
}

export function getAntiExamplesRules() {
  return loadRuleFile('anti-examples.json', fallbackAntiExamples);
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

function buildCategoryFallbackRepair(templateRules, pageMeta = {}) {
  const fallbackRepair = templateRules.categoryRepairDefaults?.[pageMeta.category] || templateRules.categoryRepairDefaults?.default;
  return {
    templateProfile: fallbackRepair?.templateProfile || 'generic-repair',
    strategy: fallbackRepair?.strategy || 'rewrite-managed-spec-to-light-smoke',
  };
}

function buildPageSpecificRepair(templateRules, pageMeta = {}, currentTemplateProfile, failure, managedEntry) {
  const pageRepairProfiles = templateRules.pageProfiles?.[pageMeta.pageName]?.repairProfiles || [];
  const currentStrategy = managedEntry?.metadata?.repairStrategy || null;

  for (const rule of pageRepairProfiles) {
    if (!repairRuleMatches(rule, currentTemplateProfile, failure)) {
      continue;
    }

    const candidate = {
      templateProfile: rule.templateProfile || currentTemplateProfile,
      strategy: rule.strategy || 'reuse-current-template',
    };

    if (candidate.templateProfile === currentTemplateProfile && candidate.strategy === currentStrategy) {
      continue;
    }

    return candidate;
  }

  return null;
}

export function resolveManagedRepairProfile(pageMeta = {}, failure, managedEntry) {
  const templateRules = getTemplateProfileRules();
  const ladderRules = getRepairLadderRules();
  const currentTemplateProfile = managedEntry?.metadata?.templateProfile || resolveManagedTemplateProfile(pageMeta);
  const currentRepairStep = Number(managedEntry?.metadata?.repairStep || 0);
  const stepOrder = ladderRules.stepOrder?.[pageMeta.category] || ladderRules.stepOrder?.default || [];
  const maxRepairSteps = Number(ladderRules.maxRepairSteps) > 0 ? Number(ladderRules.maxRepairSteps) : stepOrder.length;

  for (let index = currentRepairStep; index < Math.min(stepOrder.length, maxRepairSteps); index += 1) {
    const stepName = stepOrder[index];
    let candidate = null;

    if (stepName === 'page-specific') {
      candidate = buildPageSpecificRepair(templateRules, pageMeta, currentTemplateProfile, failure, managedEntry);
    } else if (stepName === 'category-generic') {
      candidate = buildCategoryFallbackRepair(templateRules, pageMeta);
    } else if (stepName === 'generic-smoke') {
      candidate = {
        templateProfile: ladderRules.genericSmokeTemplateProfile || 'generic-repair',
        strategy: ladderRules.genericSmokeStrategy || 'rewrite-managed-spec-to-light-smoke',
      };
    }

    if (!candidate) {
      continue;
    }

    const sameTemplate = candidate.templateProfile === currentTemplateProfile;
    const sameStrategy = candidate.strategy === (managedEntry?.metadata?.repairStrategy || null);
    if (sameTemplate && sameStrategy) {
      continue;
    }

    return {
      ...candidate,
      repairStep: index + 1,
      ladderStep: stepName,
    };
  }

  return {
    blocked: true,
    repairStep: currentRepairStep,
    ladderStep: 'exhausted',
    strategy: 'repair-ladder-exhausted',
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
    observableOutcome: typeof config.observableOutcome === 'string' && config.observableOutcome.trim()
      ? config.observableOutcome
      : null,
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

function hasObservableOutcome(pageMeta = {}, interactionHints = {}) {
  if (typeof interactionHints.observableOutcome === 'string' && interactionHints.observableOutcome.trim()) {
    return true;
  }

  if (Array.isArray(interactionHints.actionScripts)
    && interactionHints.actionScripts.some((script) => typeof script?.expectLabel === 'string' && script.expectLabel.trim())) {
    return true;
  }

  const actions = Array.isArray(interactionHints.actions) ? interactionHints.actions : [];
  if (actions.some((action) => action === 'fill-first-input' || action === 'scroll-first-list')) {
    return true;
  }

  return Array.isArray(pageMeta.stableTexts) && pageMeta.stableTexts.length > 0
    && Array.isArray(pageMeta.actionLabels) && pageMeta.actionLabels.length > 0;
}

function countStableSignals(pageMeta = {}) {
  let total = 0;
  if (pageMeta.titleText) total += 1;
  if (Array.isArray(pageMeta.stableTexts) && pageMeta.stableTexts.length > 0) total += 1;
  if (Array.isArray(pageMeta.actionLabels) && pageMeta.actionLabels.length > 0) total += 1;
  if (Array.isArray(pageMeta.componentTypes) && pageMeta.componentTypes.length > 0) total += 1;
  return total;
}

function blockerMessageById(blockers = [], id, fallback) {
  const matched = blockers.find((blocker) => blocker.id === id);
  return matched?.message || fallback;
}

export function evaluatePageTestability(pageMeta = {}, interactionHints = {}) {
  const rules = getTestabilityRules();
  const blockers = [];
  const stableSignalCount = countStableSignals(pageMeta);
  const actionablePath = hasUsableInteractionPath(pageMeta.actionLabels, interactionHints);
  const observableOutcome = hasObservableOutcome(pageMeta, interactionHints);
  const hardBlockers = Array.isArray(rules.hardBlockers) ? rules.hardBlockers : [];

  if ((rules.knownFlakyPages || []).includes(pageMeta.pageName)) {
    blockers.push({
      id: 'known-flaky-page',
      message: blockerMessageById(hardBlockers, 'known-flaky-page', 'Page is marked as known-flaky and needs manual review before auto-generation.'),
    });
  }

  if (stableSignalCount < Number(rules.minimumStableSignals || 1)) {
    blockers.push({
      id: 'missing-stable-oracle',
      message: blockerMessageById(hardBlockers, 'missing-stable-oracle', 'Page does not expose enough stable oracle signals for safe automatic assertions.'),
    });
  }

  if ((rules.categoriesRequiringActionablePath || []).includes(pageMeta.category) && !actionablePath) {
    blockers.push({
      id: 'missing-actionable-path',
      message: blockerMessageById(hardBlockers, 'missing-actionable-path', 'Page does not expose a usable action path for this category.'),
    });
  }

  const actions = Array.isArray(interactionHints.actions) ? interactionHints.actions : [];
  if (actions.includes('click-visible-labels')
    && !interactionHints.actionScripts?.length
    && Number(rules.minimumActionLabelsForClickOnly || 1) > (Array.isArray(pageMeta.actionLabels) ? pageMeta.actionLabels.length : 0)) {
    blockers.push({
      id: 'missing-actionable-path',
      message: blockerMessageById(hardBlockers, 'missing-actionable-path', 'Page relies on click-visible-labels but does not expose enough stable action labels.'),
    });
  }

  if ((rules.categoriesRequiringObservableOutcome || []).includes(pageMeta.category) && !observableOutcome) {
    blockers.push({
      id: 'missing-observable-outcome',
      message: blockerMessageById(hardBlockers, 'missing-observable-outcome', 'Page does not expose a stable post-action outcome for automatic verification.'),
    });
  }

  return {
    blocked: blockers.length > 0,
    blockers,
    stableSignalCount,
    actionablePath,
    observableOutcome,
  };
}

export function scoreBackfillPriority({
  pageMeta = {},
  suggestion = null,
  existingManaged = false,
  completenessGap = false,
  blocker = false,
  testability = null,
} = {}) {
  const rules = getPriorityMatrixRules();
  const testabilityRules = getTestabilityRules();
  const interactionHints = suggestion?.interactionHints || resolveInteractionHints(pageMeta);
  const effectiveTestability = testability || evaluatePageTestability(pageMeta, interactionHints);
  let score = Number(suggestion?.uncoveredWeight || 0) * Number(rules.coverageWeight || 1);

  score += Number(rules.categoryWeights?.[pageMeta.category] ?? rules.categoryWeights?.default ?? 0);
  if (completenessGap) score += Number(rules.completenessBonus || 0);
  if (existingManaged) {
    score -= Number(rules.existingManagedPenalty || 0);
  } else {
    score += Number(rules.missingManagedSpecBonus || 0);
  }

  if (countStableSignals(pageMeta) > 0) score += Number(rules.stableOracleBonus || 0);
  if (hasObservableOutcome(pageMeta, interactionHints)) score += Number(rules.statefulActionBonus || 0);
  if (Array.isArray(interactionHints.actionScripts) && interactionHints.actionScripts.length > 0) {
    score += Number(rules.actionScriptBonus || 0);
  }
  if ((testabilityRules.knownFlakyPages || []).includes(pageMeta.pageName)) {
    score -= Number(rules.knownFlakyPenalty || 0);
  }
  if (effectiveTestability.blocked) {
    score -= Number(rules.testabilityBlockPenalty || 0);
  }
  if (blocker) {
    score -= Number(rules.blockerPenalty || 0);
  }

  return score;
}

export function validateGeneratedSpec({
  content = '',
  targetClassification = 'functional',
  actionLabels = [],
  interactionHints = {},
  pageMeta = {},
} = {}) {
  const rules = getReviewChecklistRules();
  const antiExamples = getAntiExamplesRules();
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

    if (classificationRule.requireObservableOutcome === true
      && !hasObservableOutcome(pageMeta, interactionHints)) {
      warnings.push({
        id: 'missing-observable-outcome',
        message: 'Generated interaction spec does not expose a stable post-action outcome for the chosen page and interaction hints.',
      });
    }

    if (classificationRule.forbidActionCountOnly === true
      && /expect\(actionCount\)\.toBeGreaterThan\(0\)/u.test(content)
      && !hasObservableOutcome(pageMeta, interactionHints)) {
      warnings.push({
        id: 'functional-smoke-only',
        message: 'Generated functional spec only proves that an action executed, not that the target behavior changed.',
      });
    }
  }

  const upgrade = detectClassificationUpgradeOpportunity({
    currentClassification: targetClassification,
    content,
  });
  if (upgrade) {
    const upgradeKey = `${targetClassification}_to_${upgrade.suggestedClassification}`;
    if (rules.classificationUpgradeRules?.[upgradeKey]?.enabled !== false) {
      warnings.push({
        id: `classification-upgrade:${upgradeKey}`,
        message: upgrade.reason,
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

  for (const rule of antiExamples.patternRules || []) {
    if (!rule.pattern) {
      continue;
    }

    const regex = new RegExp(rule.pattern, 'u');
    if (!regex.test(content)) {
      continue;
    }

    warnings.push({
      id: rule.id || 'anti-example-match',
      message: rule.message || 'Generated spec matched a known anti-example rule.',
    });
  }

  return warnings;
}
