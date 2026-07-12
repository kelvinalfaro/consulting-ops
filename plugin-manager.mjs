#!/usr/bin/env node

/** List, audit, and safely install local discovery provider plugins. */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export function inspectPlugin(path) {
  const root = resolve(path);
  const manifestPath = join(root, 'manifest.yml');
  const providerPath = join(root, 'provider.mjs');
  const failures = [];
  if (!existsSync(manifestPath)) failures.push('missing manifest.yml');
  if (!existsSync(providerPath)) failures.push('missing provider.mjs');
  let manifest = {};
  if (existsSync(manifestPath)) {
    try { manifest = yaml.load(readFileSync(manifestPath, 'utf8')) ?? {}; } catch (error) { failures.push(`invalid manifest YAML: ${error.message}`); }
  }
  if (!manifest.id || !/^[a-z0-9][a-z0-9_-]*$/i.test(manifest.id)) failures.push('manifest id must be filesystem-safe');
  if (!manifest.name) failures.push('manifest name is required');
  if (existsSync(providerPath)) {
    const source = readFileSync(providerPath, 'utf8');
    if (!/export\s+default/.test(source)) failures.push('provider.mjs must export default');
    if (!/\bfetch\s*[:(]/.test(source)) failures.push('provider.mjs must define fetch');
  }
  return { root, manifest, failures, valid: failures.length === 0 };
}

export function listPlugins(roots = ['providers', 'plugins.local']) {
  const plugins = [];
  for (const base of roots.map((value) => resolve(value))) {
    if (!existsSync(base)) continue;
    for (const item of readdirSync(base, { withFileTypes: true })) {
      if (item.isDirectory() && !item.name.startsWith('_')) plugins.push(inspectPlugin(join(base, item.name)));
    }
  }
  return plugins;
}

export function installPlugin(source, options = {}) {
  const inspection = inspectPlugin(source);
  if (!inspection.valid) throw new Error(`Plugin audit failed: ${inspection.failures.join('; ')}`);
  const destinationRoot = resolve(options.destination ?? 'plugins.local');
  const destination = join(destinationRoot, inspection.manifest.id);
  if (existsSync(destination) && !options.force) throw new Error(`Plugin already exists: ${destination}`);
  mkdirSync(destinationRoot, { recursive: true });
  cpSync(inspection.root, destination, { recursive: true, force: Boolean(options.force), errorOnExist: !options.force });
  return { id: inspection.manifest.id, destination };
}

function main() {
  const [command = 'list', source, ...args] = process.argv.slice(2);
  if (command === 'list') return { plugins: listPlugins() };
  if (command === 'audit') {
    const result = source ? inspectPlugin(source) : { plugins: listPlugins() };
    if (source && !result.valid) process.exitCode = 1;
    return result;
  }
  if (command === 'install' && source) {
    const targetIndex = args.indexOf('--target');
    return installPlugin(source, { force: args.includes('--force'), destination: targetIndex >= 0 ? args[targetIndex + 1] : undefined });
  }
  throw new Error('Usage: plugin-manager.mjs list | audit [plugin-directory] | install <plugin-directory> [--target plugins.local] [--force]');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(main(), null, 2)); } catch (error) { console.error(error.message); process.exit(1); }
}
