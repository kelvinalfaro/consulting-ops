#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
export const commands = {
  doctor: 'doctor.mjs', onboard: 'onboard.mjs', auto: 'auto-pipeline.mjs', capture: 'capture-rfp.mjs',
  extract: 'extract-rfp.mjs', amend: 'add-amendment.mjs', evaluate: 'evaluate-rfp.mjs', proposal: 'generate-proposal-draft.mjs', export: 'export-proposal.mjs',
  tracker: 'rfp-tracker.mjs', compare: 'compare-rfps.mjs', 'search-terms': 'expand-search-terms.mjs', scan: 'scan-rfps.mjs', pipeline: 'process-pipeline.mjs', batch: 'batch-rfps.mjs',
  deadlines: 'deadline-watch.mjs', followup: 'followup.mjs', patterns: 'analyze-outcomes.mjs', research: 'client-research.mjs',
  debrief: 'debrief.mjs', submission: 'submission-prep.mjs', dashboard: 'build-dashboard.mjs', serve: 'dashboard-server.mjs', update: 'update-system.mjs', plugins: 'plugin-manager.mjs',
  'agent-inbox': 'agent-inbox.mjs',
  apply: 'submission-field-pack.mjs',
  'evidence-add': 'evidence-intake.mjs',
  migrate: 'migrate-career-ops.mjs',
};

export const artifactModes = new Set(['contact', 'email', 'contract', 'finalist', 'evidence', 'letter', 'finalist-plan', 'finalist-practice', 'finalist-debrief']);
export const growthModes = new Set(['training', 'service', 'adjacent', 'jurisdiction']);
export const operationalModes = new Set(['verify', 'normalize', 'dedup', 'stats', 'find', 'add', 'status', 'reconcile', 'liveness', 'inbox', 'quality']);

function help() {
  console.log(`consulting-ops -- Command Center

Available commands:
  consulting-ops <URL-or-file>  -> AUTO-PIPELINE: capture + extract + evaluate + tracker + conditional proposal
  consulting-ops scan           -> Discover current consulting opportunities from configured sources
  consulting-ops pipeline       -> Process pending sources in data/rfp_pipeline.md
  consulting-ops evaluate       -> Bid/no-bid evaluation with hard gates and weighted fit
  consulting-ops proposal       -> Compliance matrix, response outline, and source-grounded draft workspace
  consulting-ops compare        -> Compare and rank multiple pursuits
  consulting-ops research       -> Issuer and opportunity research brief
  consulting-ops contact        -> Procurement contact brief and outreach preparation
  consulting-ops email          -> Draft-only procurement or follow-up email
  consulting-ops evidence       -> Claim evidence register and gap review
  consulting-ops evidence-add   -> Stage a new case study, credential, or writing sample for approval
  consulting-ops letter         -> Standalone cover letter or letter of interest workspace
  consulting-ops amend          -> Preserve an amendment and flag material changes
  consulting-ops submission     -> Final human-review submission checklist; never submits
  consulting-ops apply          -> Prepare portal fields and attachments; always stops before submission
  consulting-ops export         -> Export review-marked PDF and DOCX
  consulting-ops finalist       -> Finalist presentation and interview preparation pack
  consulting-ops finalist-plan  -> Time-blocked finalist preparation plan
  consulting-ops finalist-practice -> One-question-at-a-time rehearsal worksheet
  consulting-ops finalist-debrief -> Post-finalist evidence and action debrief
  consulting-ops contract       -> Contract issue checklist for professional/legal review
  consulting-ops tracker        -> Pursuit status, lifecycle, and metrics
  consulting-ops inbox          -> Pending, urgent, and unowned pursuit work
  consulting-ops agent-inbox    -> Queue, inspect, and resolve cross-session requests
  consulting-ops deadlines      -> Deadline and compliance watch
  consulting-ops followup       -> Follow-up cadence and draft preparation
  consulting-ops debrief        -> Capture pursuit outcome and lessons
  consulting-ops patterns       -> Analyze win/loss/no-bid patterns
  consulting-ops dashboard      -> Build the local pursuit dashboard
  consulting-ops doctor         -> Validate setup and prerequisites
  consulting-ops update         -> Preview/apply system updates safely
  consulting-ops training       -> Assess a course or credential against firm strategy
  consulting-ops service        -> Assess a new consulting service or portfolio offering
  consulting-ops adjacent       -> Assess adjacent opportunity and market targets
  consulting-ops jurisdiction   -> Calibrate eligibility and pursuit readiness for a procurement market

Utilities: onboard, migrate, auto, capture, extract, batch, verify, normalize, dedup, reconcile, liveness, quality, stats, find, add, status, plugins, search-terms, and serve.
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

export function resolveRoute(mode, args = []) {
  if (artifactModes.has(mode)) return { script: 'pursuit-artifact.mjs', args: [mode, ...args] };
  if (growthModes.has(mode)) return { script: 'growth-assessment.mjs', args: [mode, ...args] };
  if (operationalModes.has(mode)) return { script: 'operational-tools.mjs', args: [mode, ...args] };
  if (commands[mode]) return { script: commands[mode], args };
  return { script: 'auto-pipeline.mjs', args: [mode, ...args] };
}

function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (!mode || ['help', '-h', '--help'].includes(mode)) help();
  else if (mode === 'init') init(args);
  else {
    const route = resolveRoute(mode, args);
    run(route.script, route.args);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
