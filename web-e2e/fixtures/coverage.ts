import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const webE2EConfig = require('../config/index.cjs');
const { coverage: coverageConfig, reporting } = webE2EConfig;
const V8_OUTPUT_DIR = resolve(__dirname, '..', reporting.v8TempDirName);

type V8CoverageSession = {
  context: any;
  trackedPages: Set<any>;
  pageListener: ((page: any) => void) | null;
};

function isV8CoverageEnabled(): boolean {
  return process.env.KUIKLY_COLLECT_V8_COVERAGE === 'true';
}

function getSafeTitle(testTitle?: string): string {
  return (testTitle || 'coverage')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 60);
}

async function startPageCoverage(page: any, trackedPages: Set<any>): Promise<void> {
  if (!page?.coverage || trackedPages.has(page)) {
    return;
  }

  if (typeof page.isClosed === 'function' && page.isClosed()) {
    return;
  }

  trackedPages.add(page);
  await page.coverage.startJSCoverage(coverageConfig.v8);
}

export async function startV8Coverage(page: any): Promise<V8CoverageSession | null> {
  if (!isV8CoverageEnabled()) {
    return null;
  }

  try {
    const context = page?.context?.();
    const trackedPages = new Set<any>();
    const pages = context?.pages?.() ?? [page];
    await Promise.all(
      pages.map((currentPage: any) =>
        startPageCoverage(currentPage, trackedPages).catch((error) => {
          console.warn('[coverage] Failed to start V8 coverage:', error.message);
        })
      )
    );

    const pageListener = (newPage: any) => {
      void startPageCoverage(newPage, trackedPages).catch((error) => {
        console.warn('[coverage] Failed to start V8 coverage for new page:', error.message);
      });
    };

    context?.on?.('page', pageListener);

    return {
      context,
      trackedPages,
      pageListener,
    };
  } catch (error) {
    console.warn('[coverage] Failed to initialize V8 coverage:', (error as Error).message);
    return null;
  }
}

export async function stopV8Coverage(
  session: V8CoverageSession | null,
  testTitle?: string
): Promise<void> {
  if (!session) {
    return;
  }

  try {
    session.context?.off?.('page', session.pageListener);

    const result = [] as any[];
    for (const page of session.trackedPages) {
      if (!page?.coverage) {
        continue;
      }

      if (typeof page.isClosed === 'function' && page.isClosed()) {
        continue;
      }

      try {
        const entries = await page.coverage.stopJSCoverage();
        result.push(...entries);
      } catch (error) {
        console.warn('[coverage] Failed to stop V8 coverage:', (error as Error).message);
      }
    }

    if (!result.length) {
      return;
    }

    if (!existsSync(V8_OUTPUT_DIR)) {
      mkdirSync(V8_OUTPUT_DIR, { recursive: true });
    }

    const filename = `${getSafeTitle(testTitle)}-${Date.now()}.json`;
    const outputPath = join(V8_OUTPUT_DIR, filename);
    writeFileSync(
      outputPath,
      `${JSON.stringify({
        result,
        meta: {
          testTitle: testTitle || null,
          collectedAt: new Date().toISOString(),
        },
      }, null, 2)}\n`,
      'utf8'
    );

    console.log(`[coverage] Saved V8 coverage: ${filename} (${result.length} entries)`);
  } catch (error) {
    console.warn('[coverage] Failed to persist V8 coverage:', (error as Error).message);
  }
}
