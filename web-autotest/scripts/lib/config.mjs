export const loopConfig = {
  defaultRetries: 2,
  defaultMaxNewSpecs: 3,
  maxRoundsOffsetFromRetries: 1,
};

export const displayConfig = {
  maxLowCoverageFiles: 20,
  maxSuggestions: 20,
  maxExtractedActionLabels: 12,
  maxExtractedStableTexts: 8,
  maxActionAssertionsPerSpec: 3,
  maxTopCoverageTargets: 5,
};

export const reportingConfig = {
  loopReportFileName: 'loop-report.json',
};
