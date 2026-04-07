// @kuikly-autogen {"pageName":"NetworkModuleTestPage","category":"modules","sourceFile":"demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test/modules/NetworkModuleTestPage.kt","managedBy":"kuikly-web-autotest","templateProfile":"module-network"}
import { test, expect } from '../../../fixtures/test-base';

const PAGE_NAME = "NetworkModuleTestPage";
const TITLE_TEXT = "NetworkModuleTestPage";
const STABLE_TEXTS = [
  "NetworkModuleTestPage"
];
const ACTION_LABELS = [
  "requestGet",
  "requestGetBinary",
  "requestPost",
  "requestPostBinary",
  "status204"
];

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

async function waitForOutput(page, text) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 15000 });
}

async function clickNetworkAction(page, label) {
  const labelled = page.getByLabel(label, { exact: true });
  if (await labelled.count()) {
    await labelled.first().click();
    return;
  }

  await page.getByText(label, { exact: true }).first().click();
}

test.describe('Auto generated smoke for ' + PAGE_NAME, () => {
  test('loads ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("NetworkModuleTestPage");
    await kuiklyPage.waitForRenderComplete();

    await expect(kuiklyPage.page.getByText('NetworkModuleTestPage', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestGet', { exact: true })).toBeVisible();
    await expect(kuiklyPage.page.getByLabel('requestPostBinary', { exact: true })).toBeVisible();
  });

  test('covers request success paths on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("NetworkModuleTestPage");
    await kuiklyPage.waitForRenderComplete();

    await clickNetworkAction(kuiklyPage.page, 'requestGet');
    await waitForOutput(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('success=true', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=200', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('http://localhost:8080/api/network/get?key=value', { exact: false })).toBeVisible({ timeout: 15000 });

    await clickNetworkAction(kuiklyPage.page, 'requestPost');
    await waitForOutput(kuiklyPage.page, 'Post request completed:');
    await expect(kuiklyPage.page.getByText('success=true', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=200', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('http://localhost:8080/api/network/post', { exact: false })).toBeVisible({ timeout: 15000 });

    await clickNetworkAction(kuiklyPage.page, 'requestPostBinary');
    await waitForOutput(kuiklyPage.page, 'Post request completed:');
    await expect(kuiklyPage.page.getByText('hello world', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('covers request edge paths on ' + PAGE_NAME, async ({ kuiklyPage }) => {
    await kuiklyPage.goto("NetworkModuleTestPage");
    await kuiklyPage.waitForRenderComplete();

    await clickNetworkAction(kuiklyPage.page, 'requestGetBinary');
    await waitForOutput(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('statusCode=-1002', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('Request with GET/HEAD method cannot have body.', { exact: false })).toBeVisible({ timeout: 15000 });

    await clickNetworkAction(kuiklyPage.page, 'status204');
    await waitForOutput(kuiklyPage.page, 'Get request completed:');
    await expect(kuiklyPage.page.getByText('success=false', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('statusCode=204', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(kuiklyPage.page.getByText('Unexpected end of JSON input', { exact: false })).toBeVisible({ timeout: 15000 });
  });
});
