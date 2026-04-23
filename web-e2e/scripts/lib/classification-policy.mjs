const TARGET_LEVEL_TARGETS = Object.freeze({
  static: Object.freeze(['tests/static']),
  functional: Object.freeze(['tests/functional']),
  visual: Object.freeze(['tests/visual']),
});

const LEVEL_ALIASES = Object.freeze({
  static: 'static',
  functional: 'functional',
  visual: 'visual',
  hybrid: 'hybrid',
});

const HYBRID_TARGETS = Object.freeze([
  'tests/static/components/krview-static.spec.ts',
  'tests/visual/components/krview-visual.spec.ts',
  'tests/static/input-static.spec.ts',
  'tests/functional/input-functional.spec.ts',
  'tests/functional/click-functional.spec.ts',
  'tests/visual/click-visual.spec.ts',
  'tests/functional/listscroll-functional.spec.ts',
  'tests/visual/listscroll-visual.spec.ts',
  'tests/functional/animations/css-transition-functional.spec.ts',
  'tests/visual/animations/css-transition-visual.spec.ts',
]);

const CATEGORY_TARGET_SEGMENTS = Object.freeze({
  components: Object.freeze(['static', 'components']),
  styles: Object.freeze(['static', 'styles']),
  modules: Object.freeze(['functional', 'modules']),
  interactions: Object.freeze(['functional']),
  animations: Object.freeze(['functional', 'animations']),
  composite: Object.freeze(['functional']),
});

const MANAGED_TARGET_CLASSIFICATION = Object.freeze({
  components: 'static',
  styles: 'static',
  modules: 'functional',
  interactions: 'functional',
  animations: 'functional',
  composite: 'functional',
});

export function normalizeLevelInput(level) {
  if (level == null) {
    return null;
  }

  const normalized = String(level).trim().toLowerCase();
  return LEVEL_ALIASES[normalized] || null;
}

export function isTargetLevel(level) {
  const normalized = normalizeLevelInput(level);
  return normalized === 'static' || normalized === 'functional' || normalized === 'visual' || normalized === 'hybrid';
}

export function resolvePlaywrightTargets(level) {
  const normalized = normalizeLevelInput(level);
  if (!normalized) {
    return null;
  }

  if (normalized === 'hybrid') {
    return {
      requestedLevel: String(level),
      normalizedLevel: normalized,
      targets: [...HYBRID_TARGETS],
    };
  }

  const targets = TARGET_LEVEL_TARGETS[normalized];
  if (!targets) {
    return null;
  }

  return {
    requestedLevel: String(level),
    normalizedLevel: normalized,
    targets: [...targets],
  };
}

export function resolveManagedSpecTargetSegments(pageMeta = {}) {
  return [...(CATEGORY_TARGET_SEGMENTS[pageMeta.category] || ['functional'])];
}

export function classifyManagedSpec({ pageMeta = {}, assertionMode } = {}) {
  if (assertionMode === 'visual' || assertionMode === 'hybrid') {
    return assertionMode;
  }

  return MANAGED_TARGET_CLASSIFICATION[pageMeta.category] || 'functional';
}

