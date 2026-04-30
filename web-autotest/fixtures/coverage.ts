import { createWriteStream, existsSync, mkdirSync } from 'fs';
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

async function writeCoveragePayload(
  outputPath: string,
  entries: any[],
  meta: { testTitle: string | null; collectedAt: string; pageIndex: number }
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(outputPath, { encoding: 'utf8' });
    stream.on('error', reject);
    stream.on('finish', resolve);

    stream.write('{"result":[');
    entries.forEach((entry, index) => {
      if (index > 0) {
        stream.write(',');
      }
      stream.write(JSON.stringify(entry));
    });
    stream.write(`],"meta":${JSON.stringify(meta)}}\n`);
    stream.end();
  });
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

    if (!existsSync(V8_OUTPUT_DIR)) {
      mkdirSync(V8_OUTPUT_DIR, { recursive: true });
    }

    const safeTitle = getSafeTitle(testTitle);
    const collectedAt = new Date().toISOString();
    const timestamp = Date.now();
    let totalEntries = 0;
    let fileCount = 0;

    let pageIndex = 0;
    for (const page of session.trackedPages) {
      if (!page?.coverage) {
        pageIndex += 1;
        continue;
      }

      if (typeof page.isClosed === 'function' && page.isClosed()) {
        pageIndex += 1;
        continue;
      }

      try {
        const entries = await page.coverage.stopJSCoverage();
        if (!entries.length) {
          pageIndex += 1;
          continue;
        }

        const filename = `${safeTitle}-${timestamp}-${pageIndex}.json`;
        const outputPath = join(V8_OUTPUT_DIR, filename);
        await writeCoveragePayload(outputPath, entries, {
          testTitle: testTitle || null,
          collectedAt,
          pageIndex,
        });
        totalEntries += entries.length;
        fileCount += 1;
      } catch (error) {
        console.warn('[coverage] Failed to stop V8 coverage:', (error as Error).message);
      }

      pageIndex += 1;
    }

    if (!totalEntries) {
      return;
    }

    console.log(`[coverage] Saved V8 coverage: ${safeTitle}-${timestamp}-*.json (${totalEntries} entries across ${fileCount} files)`);
  } catch (error) {
    console.warn('[coverage] Failed to persist V8 coverage:', (error as Error).message);
  }
}
