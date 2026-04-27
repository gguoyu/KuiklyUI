export function summarizeCounter(counterMap) {
  const values = Object.values(counterMap || {});
  const total = values.length;
  const covered = values.filter((value) => Number(value) > 0).length;
  const pct = total === 0 ? 100 : (covered / total) * 100;
  return { covered, total, pct };
}

export function summarizeBranches(branchMap) {
  const values = Object.values(branchMap || {}).flatMap((value) => (Array.isArray(value) ? value : []));
  const total = values.length;
  const covered = values.filter((value) => Number(value) > 0).length;
  const pct = total === 0 ? 100 : (covered / total) * 100;
  return { covered, total, pct };
}

export function computeFileMetrics(info) {
  const functions = summarizeCounter(info.f);
  const branches = summarizeBranches(info.b);
  const lineExecutionValues = Object.keys(info.statementMap || {}).map((key) => Number((info.s || {})[key] || 0));
  const lines = summarizeCounter(lineExecutionValues);

  return {
    functions,
    branches,
    lines,
  };
}
