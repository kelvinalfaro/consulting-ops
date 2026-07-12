#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { readTracker, setTrackedStatus, upsertOpportunity } from './lib/tracker-store.mjs';
import { trackerMetrics } from './lib/rfp-tracker.mjs';

function structured(path) {
  const text = readFileSync(path, 'utf8');
  return extname(path).toLowerCase() === '.json' ? JSON.parse(text) : yaml.load(text);
}

export function runTracker(command = 'list', args = []) {
  if (command === 'list') {
    const rows = readTracker();
    return { rows, metrics: trackerMetrics(rows) };
  }
  if (command === 'add' && args[0]) return upsertOpportunity(structured(resolve(args[0])));
  if (command === 'status' && args[0] && args[1]) return setTrackedStatus(args[0], args.slice(1).join(' '));
  throw new Error('Usage: node rfp-tracker.mjs list | add <opportunity.yml> | status <#|id> <state>');
}

function main() {
  const [command = 'list', ...args] = process.argv.slice(2);
  console.log(JSON.stringify(runTracker(command, args), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
