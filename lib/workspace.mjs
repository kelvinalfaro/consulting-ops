import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';

export const WORKSPACE_MARKER = '.consulting-ops-workspace.json';

export function configPath(env = process.env) {
  return resolve(env.CONSULTING_OPS_CONFIG ?? `${homedir()}/.consulting-ops/config.json`);
}

export function readConfig(env = process.env) {
  const path = configPath(env);
  if (!existsSync(path)) return { path, default_workspace: null };
  try { return { path, ...JSON.parse(readFileSync(path, 'utf8')) }; }
  catch (error) { throw new Error(`Invalid Consulting Ops config at ${path}: ${error.message}`); }
}

export function saveDefaultWorkspace(workspace, env = process.env) {
  const path = configPath(env);
  const value = { version: 1, default_workspace: resolve(workspace) };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return { path, ...value };
}

export function markWorkspace(workspace, metadata = {}) {
  const root = resolve(workspace);
  mkdirSync(root, { recursive: true });
  const path = resolve(root, WORKSPACE_MARKER);
  writeFileSync(path, `${JSON.stringify({ product: 'consulting-ops', workspace_version: 1, ...metadata }, null, 2)}\n`, 'utf8');
  return path;
}

export function extractWorkspaceArgs(args = []) {
  const remaining = [];
  let workspace = null;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--workspace') {
      if (!args[index + 1]) throw new Error('--workspace requires a path');
      workspace = args[index + 1]; index += 1;
    } else if (value.startsWith('--workspace=')) workspace = value.slice('--workspace='.length);
    else remaining.push(value);
  }
  return { workspace: workspace ? resolve(workspace) : null, args: remaining };
}

export function resolveWorkspace(options = {}) {
  const cwd = resolve(options.cwd ?? process.cwd());
  const explicit = options.explicit ? resolve(options.explicit) : null;
  const environment = options.env?.CONSULTING_OPS_WORKSPACE ? resolve(options.env.CONSULTING_OPS_WORKSPACE) : null;
  const saved = readConfig(options.env).default_workspace;
  return explicit ?? environment ?? (saved ? resolve(saved) : cwd);
}
