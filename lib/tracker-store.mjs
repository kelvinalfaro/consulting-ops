import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import yaml from 'js-yaml';
import { parseTracker, renderTracker } from './rfp-tracker.mjs';

export function canonicalStates(statesPath = resolve('templates/states.yml')) {
  const config = yaml.load(readFileSync(statesPath, 'utf8'));
  return new Map((config.states ?? []).flatMap((state) =>
    [state.label, state.id, ...(state.aliases ?? [])].map((name) => [String(name).toLowerCase(), state.label])));
}

export function normalizeState(value, statesPath) {
  const result = canonicalStates(statesPath).get(String(value).toLowerCase());
  if (!result) throw new Error(`Invalid opportunity status: ${value}`);
  return result;
}

export function readTracker(path = resolve(process.env.CONSULTING_OPS_TRACKER ?? 'data/rfp_tracker.md')) {
  return existsSync(path) ? parseTracker(readFileSync(path, 'utf8')) : [];
}

function withLock(path, operation) {
  const lock = `${path}.lock`;
  try {
    mkdirSync(lock);
  } catch {
    throw new Error(`Tracker is locked by another process: ${lock}`);
  }
  try { return operation(); } finally { rmSync(lock, { recursive: true, force: true }); }
}

export function writeTracker(rows, path = resolve(process.env.CONSULTING_OPS_TRACKER ?? 'data/rfp_tracker.md')) {
  mkdirSync(dirname(path), { recursive: true });
  return withLock(path, () => {
    const temporary = `${path}.${process.pid}.tmp`;
    writeFileSync(temporary, renderTracker(rows), 'utf8');
    renameSync(temporary, path);
    return path;
  });
}

export function findTracked(rows, opportunity) {
  const id = String(opportunity.id ?? '').toLowerCase();
  return rows.find((row) => id && String(row.notes ?? '').toLowerCase().split(/\s*;\s*/).includes(id))
    ?? rows.find((row) => String(row.issuer ?? '').toLowerCase() === String(opportunity.issuer ?? '').toLowerCase()
      && String(row.opportunity ?? '').toLowerCase() === String(opportunity.title ?? '').toLowerCase());
}

export function upsertOpportunity(opportunity, details = {}, path) {
  const rows = readTracker(path);
  let row = findTracked(rows, opportunity);
  const status = normalizeState(details.status ?? row?.status ?? 'Discovered');
  if (!row) {
    const next = Math.max(0, ...rows.map((item) => Number(item['#']) || 0)) + 1;
    row = { '#': String(next) };
    rows.push(row);
  }
  Object.assign(row, {
    identified: opportunity.posted_date ?? row.identified ?? new Date().toISOString().slice(0, 10),
    issuer: opportunity.issuer ?? row.issuer ?? '',
    opportunity: opportunity.title ?? row.opportunity ?? '',
    score: details.score ?? opportunity.assessment?.score ?? row.score ?? '',
    questions_due: opportunity.questions_due ?? row.questions_due ?? '',
    intent_due: opportunity.intent_to_bid_due ?? row.intent_due ?? '',
    due: opportunity.proposal_due ?? row.due ?? '',
    value: opportunity.budget?.amount ? `${opportunity.budget.amount} ${opportunity.budget.currency ?? ''}`.trim() : row.value ?? '',
    status,
    last_activity: details.last_activity ?? new Date().toISOString().slice(0, 10),
    next_action: details.next_action ?? row.next_action ?? '',
    report: details.report ?? row.report ?? '',
    notes: [opportunity.id, details.notes].filter(Boolean).join('; '),
  });
  writeTracker(rows, path);
  return row;
}

export function setTrackedStatus(identifier, status, path) {
  const rows = readTracker(path);
  const row = rows.find((item) => String(item['#']) === String(identifier)
    || String(item.notes ?? '').toLowerCase().split(/\s*;\s*/).includes(String(identifier).toLowerCase()));
  if (!row) throw new Error(`Tracked opportunity not found: ${identifier}`);
  row.status = normalizeState(status);
  row.last_activity = new Date().toISOString().slice(0, 10);
  writeTracker(rows, path);
  return row;
}
