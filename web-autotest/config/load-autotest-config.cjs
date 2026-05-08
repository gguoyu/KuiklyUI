'use strict';

/**
 * 统一的消费方配置加载器
 *
 * 源码模式（CWD = <repo>/）：
 *   autotestDir = <repo>/web-autotest/
 *   configPath  = <repo>/web-autotest/kuikly.autotest.config.cjs
 *
 * npm 消费方模式（CWD = <consumer>/）：
 *   autotestDir = <consumer>/web-autotest/（或 KUIKLY_AUTOTEST_DIR 覆盖）
 *   configPath  = <consumer>/web-autotest/kuikly.autotest.config.cjs（或 KUIKLY_AUTOTEST_CONFIG 覆盖）
 */

const path = require('path');

function getAutotestDir() {
  const envDir = process.env.KUIKLY_AUTOTEST_DIR;
  const projectRoot = process.env.KUIKLY_PROJECT_ROOT || process.cwd();
  if (envDir) {
    return path.isAbsolute(envDir) ? envDir : path.join(projectRoot, envDir);
  }
  return path.join(projectRoot, 'web-autotest');
}

function loadAutotestConfig() {
  const configPath =
    process.env.KUIKLY_AUTOTEST_CONFIG ||
    path.join(getAutotestDir(), 'kuikly.autotest.config.cjs');
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(configPath);
}

module.exports = { loadAutotestConfig, getAutotestDir };
