#!/usr/bin/env node

/** Cross-platform test launcher for Node versions that do not expand test globs on Windows. */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const directory = join(root, 'tests', 'consulting-ops');
const files = readdirSync(directory).filter((name) => name.endsWith('.test.mjs')).sort().map((name) => join(directory, name));
if (!files.length) throw new Error('No consulting-ops test files found');
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
