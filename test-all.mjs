#!/usr/bin/env node

/** Comprehensive, read-only consulting-ops validation launcher. */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

function filesUnder(directory, predicate) {
  const output = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (['.git', 'node_modules', 'data', 'reports', 'proposals', 'plugins.local'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...filesUnder(path, predicate));
    else if (predicate(path)) output.push(path);
  }
  return output;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: options.capture ? 'utf8' : undefined, stdio: options.capture ? 'pipe' : 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (options.capture) process.stderr.write(result.stderr || result.stdout || '');
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const scripts = filesUnder(root, (path) => path.endsWith('.mjs'));
for (const script of scripts) {
  const result = spawnSync(process.execPath, ['--check', script], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(`Syntax check failed: ${relative(root, script)}\n${result.stderr}`);
    process.exit(result.status ?? 1);
  }
}
console.log(`Syntax checks passed: ${scripts.length} modules`);

const testDirectory = join(root, 'tests', 'consulting-ops');
const tests = filesUnder(testDirectory, (path) => path.endsWith('.test.mjs'));
if (!tests.length) throw new Error('No consulting-ops test files found');
run(process.execPath, ['--test', ...tests]);

run(process.execPath, ['parity-audit.mjs']);
run(process.execPath, ['release-audit.mjs']);
run(process.execPath, ['operational-tools.mjs', 'verify']);

const packOutput = process.platform === 'win32'
  ? run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'npm pack --dry-run --json'], { capture: true })
  : run('npm', ['pack', '--dry-run', '--json'], { capture: true });
const pack = JSON.parse(packOutput);
const paths = pack[0]?.files?.map((file) => file.path) ?? [];
const forbidden = paths.filter((path) => /^(?:data|reports|proposals|case-studies|team|writing-samples)\//.test(path) && !/\.(?:gitkeep)$|^writing-samples\/README\.md$/.test(path));
if (forbidden.length) {
  console.error(`Package contains user-layer files: ${forbidden.join(', ')}`);
  process.exit(1);
}
console.log(`Package dry-run passed: ${paths.length} files, no user-layer content`);
