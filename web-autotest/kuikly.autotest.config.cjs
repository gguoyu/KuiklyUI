/**
 * Project-specific configuration for kuikly web autotest.
 *
 * This is the single source of truth for all project-coupled paths and settings.
 * When reusing the autotest framework in another project, only this file needs to change.
 */
module.exports = {
  webTestRoot: 'demo/src/commonMain/kotlin/com/tencent/kuikly/demo/pages/web_test',

  /**
   * Source roots for the Kotlin render layer under test.
   * scan-web-test-pages.mjs scans these directories to find source files that have no
   * matching web_test carrier page, and emits carrier-page-needed signals for AI to handle.
   * When reusing this framework in another project, update these paths to point
   * at the project's own render-layer source directories.
   */
  sourceRoots: [
    'core-render-web/base/src/jsMain/kotlin',
    'core-render-web/h5/src/jsMain/kotlin',
  ],

  /**
   * Package prefix used in web_test pages for this project.
   * generate-carrier-page.mjs uses this when writing the package declaration.
   */
  webTestPackagePrefix: 'com.tencent.kuikly.demo.pages.web_test',

  build: {
    defaultBuildType: 'productionExecutable',
    gradleBuildArgs: ':h5App:clean :h5App:jsDevelopmentExecutableCompileSync :demo:packLocalJSBundleDebug -Pkuikly.useLocalKsp=false --no-build-cache',
    processedResourcesDir: 'h5App/build/processedResources/js/main',
    demoDistBaseDir: 'demo/build/dist/js',
    developmentDistSubdir: 'developmentExecutable',
    kotlinWebpackDir: 'h5App/build/kotlin-webpack/js/developmentExecutable',
    kotlinModulesDir: 'h5App/build/compileSync/js/main/developmentExecutable/kotlin',
    whistleHtdocsDir: 'node_modules/whistle/biz/webui/htdocs',
    composeResourcesDirName: 'composeResources',
    fontsDirName: 'fonts',
    fontFileName: 'NotoSansSC-Regular.woff2',
    indexHtmlRelativePath: 'h5App/build/processedResources/js/main/index.html',
    nativeVueRemoteUrl: 'http://127.0.0.1:8083/nativevue2.js',
    nativeVueLocalFileName: 'nativevue2.js',
  },

  coverage: {
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 70,
    },
    watermarks: {
      lines: [80, 90],
      functions: [80, 90],
      branches: [70, 85],
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
    v8: {
      reportAnonymousScripts: true,
      resetOnNavigation: false,
    },
  },
};
