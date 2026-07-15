#!/usr/bin/env node

/** RFP-native equivalents of career-ops tracker hygiene, verification, inbox, and liveness tools. */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { pendingItems, pendingUrls } from './process-pipeline.mjs';
import { readTracker, writeTracker, normalizeState, setTrackedStatus, upsertOpportunity } from './lib/tracker-store.mjs';
import { pursuitFunnel, trackerMetrics } from './lib/rfp-tracker.mjs';
import { verifyWorkspace } from './verify-proposal-claims.mjs';

function structured(path) {
  const text = readFileSync(path, 'utf8');
  return extname(path).toLowerCase() === '.json' ? JSON.parse(text) : yaml.load(text);
}

export function verifyTracker(rows) {
  const failures = [];
  const ids = new Set();
  for (const [index, row] of rows.entries()) {
    const label = row['#'] || index + 1;
    if (!row.issuer) failures.push(`${label}: missing issuer`);
    if (!row.opportunity) failures.push(`${label}: missing opportunity`);
    if (!row.status) failures.push(`${label}: missing status`);
    else { try { normalizeState(row.status); } catch (error) { failures.push(`${label}: ${error.message}`); } }
    if (ids.has(String(row['#']))) failures.push(`${label}: duplicate tracker number`);
    ids.add(String(row['#']));
  }
  return failures;
}

export function normalizeTracker(rows) {
  return rows.map((row) => ({ ...row, status: normalizeState(row.status), score: row.score === '' ? '' : String(row.score) }));
}

function duplicateKey(row) {
  const id = String(row.notes ?? '').split(/\s*;\s*/).find((part) => /^RFP[-_\s]/i.test(part));
  return id ? `id:${id.toLowerCase()}` : `name:${String(row.issuer).trim().toLowerCase()}|${String(row.opportunity).trim().toLowerCase()}`;
}

export function deduplicateTracker(rows) {
  const byKey = new Map();
  const duplicates = [];
  for (const row of rows) {
    const key = duplicateKey(row);
    if (!byKey.has(key)) { byKey.set(key, { ...row }); continue; }
    const kept = byKey.get(key);
    duplicates.push({ kept: kept['#'], removed: row['#'], key });
    for (const field of Object.keys(row)) if (!kept[field] && row[field]) kept[field] = row[field];
    const notes = new Set([...(String(kept.notes ?? '').split(/\s*;\s*/)), ...(String(row.notes ?? '').split(/\s*;\s*/))].filter(Boolean));
    kept.notes = [...notes].join('; ');
  }
  return { rows: [...byKey.values()].map((row, index) => ({ ...row, '#': String(index + 1) })), duplicates };
}

export function findTracker(rows, query) {
  const needle = String(query).toLowerCase();
  return rows.filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(needle)));
}

function opportunityRecords(root = 'data/opportunities') {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).filter((item) => item.isFile() && /\.(?:ya?ml|json)$/i.test(item.name))
    .map((item) => ({ path: join(root, item.name), value: structured(join(root, item.name)) }));
}

export function reconcilePipeline(pipeline, records) {
  const pending = pendingUrls(pipeline);
  const captured = new Set(records.map(({ value }) => value.source_url).filter(Boolean));
  return { pending: pending.filter((url) => !captured.has(url)), captured: pending.filter((url) => captured.has(url)), orphan_records: records.filter(({ value }) => value.source_url && !pending.includes(value.source_url)).map(({ path }) => path) };
}

export async function checkLiveness(records, fetchImpl = fetch) {
  const results = [];
  for (const { path, value } of records) {
    if (!/^https?:\/\//i.test(value.source_url ?? '')) { results.push({ path, url: value.source_url ?? null, status: 'not-checkable' }); continue; }
    try {
      let response = await fetchImpl(value.source_url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (response.status === 405) response = await fetchImpl(value.source_url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      results.push({ path, url: value.source_url, status: response.ok ? 'live' : 'unavailable', http_status: response.status });
    } catch (error) { results.push({ path, url: value.source_url, status: 'error', error: error.message }); }
  }
  return results;
}

export function inboxSummary(pipeline, rows) {
  const now = Date.now();
  const active = rows.filter((row) => !['Won', 'Lost', 'No Bid', 'Withdrawn', 'Cancelled', 'Expired', 'Duplicate'].includes(row.status));
  const urgent = active.filter((row) => {
    const due = Date.parse(row.due);
    return Number.isFinite(due) && due >= now && due - now <= 7 * 86400000;
  });
  return { unchecked_sources: pendingItems(pipeline).length, active: active.length, urgent, missing_next_action: active.filter((row) => !row.next_action) };
}

export function scanRunSummary(tsv = '') {
  const lines = tsv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const headers = lines[0].split('\t');
  const records = lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] ?? '']))).filter((row) => row.timestamp && row.status);
  if (!records.length) return null;
  const completed = records.filter((row) => row.status === 'completed');
  const sum = (field) => completed.reduce((total, row) => total + (Number(row[field]) || 0), 0);
  return { runs: records.length, partial_runs: records.filter((row) => row.status === 'partial').length, last_run: records.at(-1), total_actionable: sum('actionable'), total_source_leads: sum('source_leads'), average_rejection_rate: completed.length && sum('scanned') ? Math.round(sum('rejected') / sum('scanned') * 1000) / 10 : null };
}

export function qualityCheck(workspace) {
  const required = ['README.md', 'compliance-matrix.md', 'clarification-questions.md', 'evidence-map.md', 'proposal-draft.md', 'review-checklist.md'];
  const missing = required.filter((file) => !existsSync(join(workspace, file)));
  const draft = existsSync(join(workspace, 'proposal-draft.md')) ? readFileSync(join(workspace, 'proposal-draft.md'), 'utf8') : '';
  const placeholders = (draft.match(/\[[^\]\n]{3,}\]/g) ?? []).length;
  let claims = { valid: false, unsupported: [], claims: [] };
  if (!missing.includes('proposal-draft.md')) {
    try { claims = verifyWorkspace(workspace); } catch { /* reported by ordinary workspace checks */ }
  }
  return { ready: missing.length === 0 && placeholders === 0 && claims.valid, missing, placeholders, unsupported_metrics: claims.unsupported, submission_authorized: false };
}

async function run(command, args) {
  const trackerPath = resolve(process.env.CONSULTING_OPS_TRACKER ?? 'data/rfp_tracker.md');
  const pipelinePath = resolve(process.env.CONSULTING_OPS_PIPELINE ?? 'data/rfp_pipeline.md');
  const rows = readTracker(trackerPath);
  const pipeline = existsSync(pipelinePath) ? readFileSync(pipelinePath, 'utf8') : '';
  if (command === 'verify') { const failures = verifyTracker(rows); return { status: failures.length ? 'failed' : 'passed', failures }; }
  if (command === 'normalize') { const normalized = normalizeTracker(rows); writeTracker(normalized, trackerPath); return { normalized: normalized.length }; }
  if (command === 'dedup') { const result = deduplicateTracker(rows); if (!args.includes('--dry-run')) writeTracker(result.rows, trackerPath); return { ...result, rows: result.rows.length, dry_run: args.includes('--dry-run') }; }
  if (command === 'stats') {
    const runsPath = resolve('data/scan-runs.tsv');
    return { metrics: trackerMetrics(rows), funnel: pursuitFunnel(rows), statuses: Object.fromEntries([...new Set(rows.map((r) => r.status))].map((status) => [status, rows.filter((r) => r.status === status).length])), scan_runs: scanRunSummary(existsSync(runsPath) ? readFileSync(runsPath, 'utf8') : '') };
  }
  if (command === 'find') return { query: args.join(' '), rows: findTracker(rows, args.join(' ')) };
  if (command === 'add') return upsertOpportunity(structured(resolve(args[0])), {}, trackerPath);
  if (command === 'status') return setTrackedStatus(args[0], args.slice(1).join(' '), trackerPath);
  if (command === 'reconcile') return reconcilePipeline(pipeline, opportunityRecords());
  if (command === 'liveness') return { results: await checkLiveness(opportunityRecords()) };
  if (command === 'inbox') return inboxSummary(pipeline, rows);
  if (command === 'quality') return qualityCheck(resolve(args[0] ?? '.'));
  throw new Error('Usage: operational-tools.mjs verify|normalize|dedup [--dry-run]|stats|find <query>|add <record>|status <id> <state>|reconcile|liveness|inbox|quality <workspace>');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  run(command, args).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exit(1); });
}
