module.exports = {
  fallbackThresholds: {
    lines: 70,
    functions: 70,
    statements: 70,
    branches: 55,
  },
  scopeRoots: [
    'core-render-web/base/src/jsMain/kotlin',
    'core-render-web/h5/src/jsMain/kotlin',
  ],
  generatedKotlinOutputDir: 'h5App/build/compileSync/js/main/developmentExecutable/kotlin',
  targetModules: [
    'KuiklyCore-render-web-base.js',
    'KuiklyCore-render-web-h5.js',
    'KuiklyUI-h5App.js',
  ],
};
