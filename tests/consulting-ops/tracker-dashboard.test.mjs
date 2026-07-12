import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTracker, renderTracker, trackerMetrics } from '../../lib/rfp-tracker.mjs';
import { renderDashboard } from '../../build-dashboard.mjs';

const markdown = `# Tracker

| # | Identified | Issuer | Opportunity | Score | Due | Value | Status | Report | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-07-01 | City | Plan | 4.2 | 2027-01-01 | $50k | Bid | r.md | |
| 2 | 2026-06-01 | County | Coach | 4.5 | 2026-06-30 | $20k | Won | w.md | |
`;

test('parses RFP tracker and computes pursuit metrics', () => {
  const rows = parseTracker(markdown);
  const metrics = trackerMetrics(rows, new Date('2026-07-11'));
  assert.equal(rows.length, 2);
  assert.equal(metrics.active, 1);
  assert.equal(metrics.won, 1);
  assert.equal(metrics.win_rate, 100);
});

test('tracker render round-trips canonical columns', () => {
  const rows = parseTracker(markdown);
  const rendered = renderTracker(rows);
  assert.equal(parseTracker(rendered)[0].issuer, 'City');
  assert.match(rendered, /\| # \| Identified \| Issuer/);
});

test('dashboard escapes tracker content', () => {
  const html = renderDashboard([{ issuer: '<script>', status: 'Bid' }], { total: 1, active: 1, submitted: 0, won: 0, win_rate: null, next_deadline: null });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
