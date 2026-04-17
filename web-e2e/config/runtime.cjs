const runtime = {
  defaultPort: 8080,
  playwrightTimeoutMs: 60_000,
  webServerTimeoutMs: 30_000,
  ciWorkers: 1,
  ciRetries: 2,
  localRetries: 1,
};

function resolvePort(env = process.env) {
  return Number(env.KUIKLY_PORT || env.PORT || runtime.defaultPort);
}

function resolvePlaywrightWorkers({ env = process.env } = {}) {
  const workerOverride = env.KUIKLY_WORKERS ? Number(env.KUIKLY_WORKERS) : null;
  return workerOverride ?? (env.CI ? runtime.ciWorkers : undefined);
}

function resolvePlaywrightRetries({ env = process.env } = {}) {
  return env.CI ? runtime.ciRetries : runtime.localRetries;
}

module.exports = {
  ...runtime,
  resolvePort,
  resolvePlaywrightWorkers,
  resolvePlaywrightRetries,
};
