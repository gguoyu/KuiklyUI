import { execFileSync } from 'child_process';
import { join } from 'path';
import { repoRoot, skillScripts } from './paths.mjs';

export function runScriptJson(scriptPath, ...extraArgs) {
  const output = execFileSync(process.execPath, [scriptPath, ...extraArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

export function runSiblingScriptJson(scriptName, ...extraArgs) {
  return runScriptJson(join(skillScripts, scriptName), ...extraArgs);
}

export function tryRunSiblingScriptJson(scriptName, fallbackError) {
  try {
    return runSiblingScriptJson(scriptName);
  } catch {
    return { error: fallbackError };
  }
}
