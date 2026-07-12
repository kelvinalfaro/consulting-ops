#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTracker, trackerMetrics } from './lib/rfp-tracker.mjs';

function escape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderDashboard(rows, metrics) {
  const columns = rows.length ? Object.keys(rows[0]) : ['#', 'identified', 'issuer', 'opportunity', 'score', 'due', 'value', 'status', 'report', 'notes'];
  const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${escape(row[column])}</td>`).join('')}</tr>`).join('\n');
  const next = metrics.next_deadline ? new Date(metrics.next_deadline).toLocaleString() : 'None recorded';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>consulting-ops dashboard</title><style>
:root{color-scheme:light dark;--bg:#f5f1e8;--ink:#17231c;--card:#fffdf8;--accent:#176b55;--line:#d4cfc2}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,sans-serif}main{max-width:1400px;margin:auto;padding:32px}h1{font:700 34px Georgia,serif;margin:0 0 6px}.sub{color:#536158;margin-bottom:24px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}.card strong{display:block;font-size:28px;color:var(--accent)}.table{overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:12px}table{border-collapse:collapse;width:100%}th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}th{position:sticky;top:0;background:var(--card);text-transform:capitalize}tr:last-child td{border:0}.notice{margin-top:18px;font-size:13px;color:#536158}@media(prefers-color-scheme:dark){:root{--bg:#101713;--ink:#e5eee8;--card:#17211b;--accent:#72d0ac;--line:#35463c}.sub,.notice{color:#a8b7ad}}
</style></head><body><main><h1>consulting-ops</h1><div class="sub">RFP pursuit dashboard · generated ${escape(new Date().toLocaleString())}</div>
<section class="cards"><div class="card"><span>Opportunities</span><strong>${metrics.total}</strong></div><div class="card"><span>Active pursuits</span><strong>${metrics.active}</strong></div><div class="card"><span>Submitted</span><strong>${metrics.submitted}</strong></div><div class="card"><span>Won</span><strong>${metrics.won}</strong></div><div class="card"><span>Win rate</span><strong>${metrics.win_rate == null ? '—' : `${metrics.win_rate}%`}</strong></div><div class="card"><span>Next deadline</span><strong style="font-size:16px">${escape(next)}</strong></div></section>
<div class="table"><table><thead><tr>${columns.map((column) => `<th>${escape(column.replaceAll('_', ' '))}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}">No opportunities recorded.</td></tr>`}</tbody></table></div>
<div class="notice">This dashboard is read-only. Update the canonical tracker through consulting-ops workflows. Final proposal submission always remains with the user.</div></main></body></html>`;
}

function main() {
  const trackerPath = resolve(process.argv[2] ?? 'data/rfp_tracker.md');
  if (!existsSync(trackerPath)) throw new Error(`Tracker not found: ${trackerPath}`);
  const rows = parseTracker(readFileSync(trackerPath, 'utf8'));
  const html = renderDashboard(rows, trackerMetrics(rows));
  mkdirSync(resolve('dashboard'), { recursive: true });
  const output = resolve('dashboard/index.html');
  writeFileSync(output, html, 'utf8');
  console.log(`Built ${output}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
