#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import yaml from 'js-yaml';
import { parseTracker, renderTracker, trackerMetrics } from './lib/rfp-tracker.mjs';

const trackerPath = resolve(process.env.CONSULTING_OPS_TRACKER ?? 'data/rfp_tracker.md');
const statesPath = resolve('templates/states.yml');

function readRows() {
  return existsSync(trackerPath) ? parseTracker(readFileSync(trackerPath, 'utf8')) : [];
}

function allowedStates() {
  const config = yaml.load(readFileSync(statesPath, 'utf8'));
  return new Map((config.states ?? []).flatMap((state) => [state.label, ...(state.aliases ?? [])].map((name) => [name.toLowerCase(), state.label])));
}

function canonicalState(value) {
  const state = allowedStates().get(String(value).toLowerCase());
  if (!state) throw new Error(`Invalid status: ${value}`);
  return state;
}

function structured(path) {
  const text = readFileSync(path, 'utf8');
  return extname(path).toLowerCase() === '.json' ? JSON.parse(text) : yaml.load(text);
}

function writeRows(rows) {
  writeFileSync(trackerPath, renderTracker(rows), 'utf8');
}

function add(file) {
  const opportunity = structured(resolve(file));
  const rows = readRows();
  const duplicate = rows.find((row) => row.issuer?.toLowerCase() === String(opportunity.issuer).toLowerCase()
    && row.opportunity?.toLowerCase() === String(opportunity.title).toLowerCase());
  if (duplicate) throw new Error(`Opportunity already tracked as #${duplicate['#']}`);
  const next = Math.max(0, ...rows.map((row) => Number(row['#']) || 0)) + 1;
  rows.push({
    '#': next,
    identified: opportunity.posted_date ?? new Date().toISOString().slice(0, 10),
    issuer: opportunity.issuer ?? '',
    opportunity: opportunity.title ?? '',
    score: opportunity.assessment?.score ?? '',
    due: opportunity.proposal_due ?? '',
    value: opportunity.budget?.amount ? `${opportunity.budget.amount} ${opportunity.budget.currency ?? ''}`.trim() : '',
    status: 'Discovered',
    report: '',
    notes: opportunity.id ?? '',
  });
  writeRows(rows);
  return rows.at(-1);
}

function setStatus(id, status) {
  const rows = readRows();
  const row = rows.find((item) => String(item['#']) === String(id) || item.notes === id);
  if (!row) throw new Error(`Tracked opportunity not found: ${id}`);
  row.status = canonicalState(status);
  writeRows(rows);
  return row;
}

const [command = 'list', ...args] = process.argv.slice(2);
if (command === 'list') {
  const rows = readRows();
  console.log(JSON.stringify({ rows, metrics: trackerMetrics(rows) }, null, 2));
} else if (command === 'add' && args[0]) {
  console.log(JSON.stringify(add(args[0]), null, 2));
} else if (command === 'status' && args[0] && args[1]) {
  console.log(JSON.stringify(setStatus(args[0], args.slice(1).join(' ')), null, 2));
} else {
  console.log('Usage: node rfp-tracker.mjs list | add <opportunity.yml> | status <#|id> <state>');
  process.exitCode = 1;
}
