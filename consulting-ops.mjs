#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const commands = {
  doctor: 'doctor.mjs', onboard: 'onboard.mjs', auto: 'auto-pipeline.mjs', capture: 'capture-rfp.mjs',
  extract: 'extract-rfp.mjs', amend: 'add-amendment.mjs', evaluate: 'evaluate-rfp.mjs', proposal: 'generate-proposal-draft.mjs', export: 'export-proposal.mjs',
  tracker: 'rfp-tracker.mjs', compare: 'compare-rfps.mjs', 'search-terms': 'expand-search-terms.mjs', scan: 'scan-rfps.mjs', pipeline: 'process-pipeline.mjs', batch: 'batch-rfps.mjs',
  deadlines: 'deadline-watch.mjs', followup: 'followup.mjs', patterns: 'analyze-outcomes.mjs', research: 'client-research.mjs',
  debrief: 'debrief.mjs', submission: 'submission-prep.mjs', dashboard: 'build-dashboard.mjs', serve: 'dashboard-server.mjs', update: 'update-system.mjs', plugins: 'plugin-manager.mjs',
};

const artifactModes = new Set(['contact', 'email', 'contract', 'finalist', 'evidence']);
const operationalModes = new Set(['verify', 'normalize', 'dedup', 'stats', 'find', 'add', 'status', 'reconcile', 'liveness', 'inbox', 'quality']);

function help() {
  console.log(`consulting-ops -- RFP Pursuit Command Center

Usage:
  consulting-ops <URL-or-file>       Auto-pipeline: capture, extract, evaluate, track, and conditionally draft
  consulting-ops auto <source>       Run the same auto-pipeline explicitly
  consulting-ops onboard             Guided firm setup
  consulting-ops scan                Discover opportunities from configured sources
  consulting-ops pipeline            Process data/rfp_pipeline.md
  consulting-ops capture <source>    Preserve an RFP URL or file
  consulting-ops extract <record>    Extract dates, requirements, criteria, contacts, and budget
  consulting-ops amend <record> <source> Preserve an amendment and flag changes
  consulting-ops evaluate <record>   Bid/no-bid evaluation, report, and tracker update
  consulting-ops proposal <record>   Compliance-first proposal workspace
  consulting-ops tracker [command]   Pipeline status and metrics
  consulting-ops dashboard           Build the HTML dashboard
  consulting-ops serve [port]        Serve the dashboard locally
  consulting-ops doctor              Validate setup
  consulting-ops verify              Verify tracker integrity and canonical states
  consulting-ops dedup [--dry-run]   Detect and merge duplicate tracker rows
  consulting-ops reconcile           Compare pipeline sources with captured records
  consulting-ops liveness            Check captured source URLs
  consulting-ops inbox               Summarize pending, urgent, and unowned work

Additional modes: normalize, stats, find, add, status, quality, batch, deadlines, followup, research, debrief, patterns, contact, email, contract, finalist, evidence, and update.
The system never submits a proposal.`);
}

function run(script, args) {
  const path = resolve(root, script);
  if (!existsSync(path)) {
    console.error(`Mode is planned but not installed in this version: ${script}`);
    process.exit(2);
  }
  const result = spawnSync(process.execPath, [path, ...args], { cwd: process.cwd(), stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

function init(args) {
  const target = resolve(args[0] ?? 'consulting-ops');
  if (existsSync(target)) throw new Error(`Target already exists: ${target}`);
  let result = spawnSync('git', ['clone', '--depth', '1', 'https://github.com/kelvinalfaro/consulting-ops.git', target], {
    stdio: 'inherit', shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
  result = spawnSync('npm', ['install'], { cwd: target, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`\nInstalled consulting-ops in ${target}\n\nNext:\n  cd ${target}\n  npx consulting-ops onboard`);
}

try {
  const [mode, ...args] = process.argv.slice(2);
  if (!mode || ['help', '-h', '--help'].includes(mode)) help();
  else if (mode === 'init') init(args);
  else if (artifactModes.has(mode)) run('pursuit-artifact.mjs', [mode, ...args]);
  else if (operationalModes.has(mode)) run('operational-tools.mjs', [mode, ...args]);
  else if (commands[mode]) run(commands[mode], args);
  else run('auto-pipeline.mjs', [mode, ...args]);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
