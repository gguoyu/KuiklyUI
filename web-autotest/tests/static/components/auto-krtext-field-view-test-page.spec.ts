// @kuikly-autogen {"pageName":"KRTextFieldViewTestPage","category":"components","sourceFile":"demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/components/KRTextFieldViewTestPage.kt","managedBy":"web-autotest","templateProfile":"default","targetClassification":"static","specLocation":"web-autotest/tests/static/components/auto-krtext-field-view-test-page.spec.ts","migrationPhase":"semantic-closure","repairReason":"coverage-refresh","repairStrategy":null,"repairStep":0,"repairLadderStep":null}
import { test, expect } from '../../../fixtures/test-base';

const PAGE_NAME = "KRTextFieldViewTestPage";
const TITLE_TEXT = "1. Basic Input";
const STABLE_TEXTS = [
  "1. Basic Input",
  "input-value: ${ctx.inputValue}",
  "3. Read-only Toggle",
  "4. Styled Input"
];
const ACTION_LABELS = [];
const INTERACTION_HINTS = {
  "actions": [
    "click-visible-labels",
    "run-action-scripts"
  ],
  "actionScripts": [
    {
      "kind": "click",
      "targetLabel": "readonly-inactive",
      "expectLabel": "readonly-active"
    },
    {
      "kind": "click",
      "targetLabel": "clear-idle",
      "expectLabel": "clear-count: 1"
    }
  ],
  "maxActionLabels": 4,
  "postActionWaitMs": 250,
  "recheckPageReadyAfterAction": true,
  "scrollDeltaY": 520,
  "inputText": "Hello Kuikly",
  "observableOutcome": null
};
const ANIMATION_HINTS = {
  "preferredWait": "waitForAnimationEnd",
  "fallbackWaitMs": 900,
  "ciFallbackWaitMs": 1200,
  "preferStateAssertions": true,
  "repairTemplateProfile": "animation-generic-repair",
  "genericTemplateProfile": "default"
};

async function expectPageReady(kuiklyPage) {
  if (TITLE_TEXT) {
    await expect(kuiklyPage.page.getByText(TITLE_TEXT, { exact: false }).first()).toBeVisible();
    return;
  }

  if (STABLE_TEXTS.length > 0) {
    await expect(kuiklyPage.page.getByText(STABLE_TEXTS[0], { exact: false }).first()).toBeVisible();
    return;
  }

  await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
}

async function clickLabelIfPresent(kuiklyPage, label) {
  const exact = kuiklyPage.page.getByText(label, { exact: true });
  if (await exact.count()) {
    await exact.first().click({ force: true, timeout: 2000 }).catch(() => {});
    return true;
  }

  const fuzzy = kuiklyPage.page.getByText(label, { exact: false });
  if (await fuzzy.count()) {
    await fuzzy.first().click({ force: true, timeout: 2000 }).catch(() => {});
    return true;
  }

  return false;
}

async function locateFirstScrollableComponent(kuiklyPage) {
  for (const type of ['KRListView', 'KRScrollView']) {
    const locator = kuiklyPage.component(type).first();
    if (await locator.count()) {
      return locator;
    }
  }

  return null;
}

async function fillFirstInputIfPresent(kuiklyPage) {
  const input = kuiklyPage.page.locator('input, textarea').first();
  if (!(await input.count())) {
    return false;
  }

  const nextText = INTERACTION_HINTS.inputText || 'Hello Kuikly';
  await input.click().catch(() => {});
  await input.fill(nextText).catch(async () => {
    await kuiklyPage.page.keyboard.type(nextText, { delay: 20 }).catch(() => {});
  });

  const currentValue = await input.inputValue().catch(() => '');
  return currentValue.includes(nextText) || currentValue.length > 0;
}

async function scrollFirstListIfPresent(kuiklyPage) {
  const container = await locateFirstScrollableComponent(kuiklyPage);
  if (!container) {
    return false;
  }

  const before = await container.evaluate((el) => (el instanceof HTMLElement ? el.scrollTop : 0)).catch(() => 0);
  await kuiklyPage.scrollInContainer(container, {
    deltaY: INTERACTION_HINTS.scrollDeltaY || 520,
    smooth: false,
  }).catch(() => {});
  await kuiklyPage.page.waitForTimeout(INTERACTION_HINTS.postActionWaitMs || 250);
  const after = await container.evaluate((el) => (el instanceof HTMLElement ? el.scrollTop : 0)).catch(() => before);
  return after > before || after > 0;
}

async function clickVisibleLabels(kuiklyPage, { stopAfterFirstSuccess = false } = {}) {
  let clickedCount = 0;
  const limit = INTERACTION_HINTS.maxActionLabels || ACTION_LABELS.length;

  for (const label of ACTION_LABELS.slice(0, limit)) {
    const clicked = await clickLabelIfPresent(kuiklyPage, label);
    if (!clicked) {
      continue;
    }

    clickedCount += 1;
    await kuiklyPage.page.waitForTimeout(INTERACTION_HINTS.postActionWaitMs || 250);
    if (INTERACTION_HINTS.recheckPageReadyAfterAction !== false) {
      await expectPageReady(kuiklyPage);
    }
    if (stopAfterFirstSuccess) {
      break;
    }
  }

  return clickedCount;
}

function findExactText(kuiklyPage, label) {
  return kuiklyPage.page.getByText(label, { exact: true }).first();
}

async function longPressTextLabel(kuiklyPage, label) {
  const target = findExactText(kuiklyPage, label);
  if (!(await target.count())) {
    return false;
  }

  const box = await target.boundingBox();
  if (!box) {
    return false;
  }

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await kuiklyPage.page.mouse.move(x, y);
  await kuiklyPage.page.mouse.down();
  await kuiklyPage.page.waitForTimeout(850);
  await kuiklyPage.page.mouse.up();
  return true;
}

async function runActionScripts(kuiklyPage) {
  let completed = 0;

  for (const script of INTERACTION_HINTS.actionScripts || []) {
    const target = script?.targetLabel;
    const expectLabel = script?.expectLabel;
    if (!target) {
      continue;
    }

    const locator = findExactText(kuiklyPage, target);
    if (!(await locator.count())) {
      continue;
    }

    if (script.kind === 'double-click') {
      await locator.dblclick();
    } else if (script.kind === 'long-press') {
      const pressed = await longPressTextLabel(kuiklyPage, target);
      if (!pressed) {
        continue;
      }
    } else {
      await locator.click();
    }

    completed += 1;
    await kuiklyPage.page.waitForTimeout(INTERACTION_HINTS.postActionWaitMs || 250);
    if (expectLabel) {
      await expect(findExactText(kuiklyPage, expectLabel)).toBeVisible();
    }
    if (INTERACTION_HINTS.recheckPageReadyAfterAction !== false) {
      await expectPageReady(kuiklyPage);
    }
  }

  return completed;
}

async function runRuleDrivenInteractions(kuiklyPage, { stopAfterFirstSuccess = false } = {}) {
  let completed = 0;

  for (const action of INTERACTION_HINTS.actions || []) {
    if (action === 'run-action-scripts') {
      const scripted = await runActionScripts(kuiklyPage);
      completed += scripted;
      if (scripted > 0 || stopAfterFirstSuccess) {
        return completed;
      }
      continue;
    }

    if (action === 'fill-first-input') {
      const filled = await fillFirstInputIfPresent(kuiklyPage);
      if (filled) {
        completed += 1;
        if (INTERACTION_HINTS.recheckPageReadyAfterAction !== false) {
          await expectPageReady(kuiklyPage);
        }
        if (stopAfterFirstSuccess) {
          return completed;
        }
      }
      continue;
    }

    if (action === 'scroll-first-list') {
      const scrolled = await scrollFirstListIfPresent(kuiklyPage);
      if (scrolled) {
        completed += 1;
        if (INTERACTION_HINTS.recheckPageReadyAfterAction !== false) {
          await expectPageReady(kuiklyPage);
        }
        if (stopAfterFirstSuccess) {
          return completed;
        }
      }
      continue;
    }

    if (action === 'click-visible-labels') {
      const clicks = await clickVisibleLabels(kuiklyPage, { stopAfterFirstSuccess });
      completed += clicks;
      if (stopAfterFirstSuccess && clicks > 0) {
        return completed;
      }
    }
  }

  return completed;
}

async function waitForAnimationStrategy(kuiklyPage, locator = null) {
  if (process.env.CI === 'true') {
    await kuiklyPage.page.waitForTimeout(ANIMATION_HINTS.ciFallbackWaitMs || ANIMATION_HINTS.fallbackWaitMs || 1200);
    return;
  }

  try {
    if (ANIMATION_HINTS.preferredWait === 'waitForTransitionEnd' && locator) {
      await kuiklyPage.waitForTransitionEnd(locator);
      return;
    }

    if (ANIMATION_HINTS.preferredWait === 'waitForAnimationEnd') {
      await kuiklyPage.waitForAnimationEnd();
      return;
    }
  } catch {
    // fall through to time-based fallback
  }

  await kuiklyPage.page.waitForTimeout(ANIMATION_HINTS.fallbackWaitMs || 900);
}

function hasUsableInteractionHints() {
  return (Array.isArray(INTERACTION_HINTS.actionScripts) && INTERACTION_HINTS.actionScripts.length > 0)
    || ACTION_LABELS.length > 0
    || (INTERACTION_HINTS.actions || []).some((action) => action !== 'click-visible-labels');
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("KRTextFieldViewTestPage");
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);
    await expect(kuiklyPage.page.locator('[data-kuikly-component]').first()).toBeVisible();
  });

  test('executes rule-driven interactions on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    test.skip(!hasUsableInteractionHints(), 'No usable interaction hints were resolved for this page.');

    await kuiklyPage.goto("KRTextFieldViewTestPage");
    await kuiklyPage.waitForRenderComplete();
    await expectPageReady(kuiklyPage);

    const actionCount = await runRuleDrivenInteractions(kuiklyPage);
    expect(actionCount).toBeGreaterThan(0);
  });
});
