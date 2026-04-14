const runtime = {
  defaultPort: 8080,
  playwrightTimeoutMs: 60_000,
  webServerTimeoutMs: 30_000,
  instrumentedDefaultWorkers: 2,
  ciWorkers: 1,
  ciRetries: 2,
  localRetries: 1,
  instrumentedRetries: 0,
  instrumentedServerReadyTimeoutMs: 30_000,
  instrumentedServerStopTimeoutMs: 5_000,
  instrumentedServerForceStopTimeoutMs: 3_000,
  httpProbeTimeoutMs: 1_500,
  httpProbeRetryDelayMs: 500,
};

function resolvePort(env = process.env) {
  return Number(env.KUIKLY_PORT || env.PORT || runtime.defaultPort);
}

function resolvePlaywrightWorkers({ instrumented = false, env = process.env } = {}) {
  const workerOverride = env.KUIKLY_WORKERS ? Number(env.KUIKLY_WORKERS) : null;
  return workerOverride ?? (instrumented ? runtime.instrumentedDefaultWorkers : (env.CI ? runtime.ciWorkers : undefined));
}

function resolvePlaywrightRetries({ instrumented = false, env = process.env } = {}) {
  return instrumented ? runtime.instrumentedRetries : (env.CI ? runtime.ciRetries : runtime.localRetries);
}

module.exports = {
  ...runtime,
  resolvePort,
  resolvePlaywrightWorkers,
  resolvePlaywrightRetries,
};
