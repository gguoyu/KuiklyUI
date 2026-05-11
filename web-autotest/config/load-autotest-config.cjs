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

/**
 * 判断当前配置是否为业务模式（多业务消费方）
 * @param {object} [config] - 可选，传入配置对象；不传则自动加载
 */
function isBusinessMode(config) {
  if (!config) {
    try { config = loadAutotestConfig(); } catch (e) { return false; }
  }
  return config.mode === 'business' || Array.isArray(config.businesses);
}

/**
 * 业务模式下返回 server.baseURL；否则返回 null（走 runtime 默认值）
 */
function resolveBusinessBaseURL(config) {
  if (!config) {
    try { config = loadAutotestConfig(); } catch (e) { return null; }
  }
  if (isBusinessMode(config) && config.server && config.server.baseURL) {
    return config.server.baseURL;
  }
  return null;
}

module.exports = { loadAutotestConfig, getAutotestDir, isBusinessMode, resolveBusinessBaseURL };
