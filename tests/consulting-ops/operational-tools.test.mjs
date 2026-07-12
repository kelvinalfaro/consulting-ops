import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkLiveness, deduplicateTracker, findTracker, inboxSummary, qualityCheck, reconcilePipeline, scanRunSummary, verifyTracker } from '../../operational-tools.mjs';

const valid = { '#': '1', issuer: 'Agency', opportunity: 'Planning RFP', status: 'Bid', notes: 'RFP-1', due: '', next_action: '' };

test('verifies, finds, and deduplicates tracker rows', () => {
  assert.deepEqual(verifyTracker([valid]), []);
  assert.equal(findTracker([valid], 'planning').length, 1);
  const result = deduplicateTracker([valid, { ...valid, '#': '2', report: 'reports/2.md' }]);
  assert.equal(result.rows.length, 1);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.rows[0].report, 'reports/2.md');
});

test('reconciles pipeline URLs and summarizes inbox work', () => {
  const pipeline = '# Pipeline\n## Pending\n- [ ] https://example.test/one\n- [ ] https://example.test/two\n## Source leads\n- [ ] https://example.test/portal\n';
  const result = reconcilePipeline(pipeline, [{ path: 'one.yml', value: { source_url: 'https://example.test/one' } }]);
  assert.deepEqual(result.captured, ['https://example.test/one']);
  assert.deepEqual(result.pending, ['https://example.test/two']);
  const inbox = inboxSummary(pipeline, [valid]);
  assert.equal(inbox.unchecked_sources, 2);
  assert.equal(inbox.missing_next_action.length, 1);
});

test('checks proposal quality without authorizing submission', () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-quality-'));
  for (const file of ['README.md', 'compliance-matrix.md', 'clarification-questions.md', 'evidence-map.md', 'proposal-draft.md', 'review-checklist.md']) writeFileSync(join(root, file), file === 'proposal-draft.md' ? '# Draft\n[Complete this section]' : '# Review');
  const result = qualityCheck(root);
  assert.equal(result.ready, false);
  assert.equal(result.submission_authorized, false);
  assert.equal(result.placeholders, 1);
});

test('liveness reports provider responses and non-HTTP records', async () => {
  const records = [{ path: 'one.yml', value: { source_url: 'https://example.test/rfp' } }, { path: 'two.yml', value: {} }];
  const results = await checkLiveness(records, async () => ({ ok: true, status: 200 }));
  assert.equal(results[0].status, 'live');
  assert.equal(results[1].status, 'not-checkable');
});

test('scan run summary separates partial runs and computes completed-run quality', () => {
  const tsv = 'timestamp\tstatus\tscanned\tactionable\tsource_leads\trejected\tduplicates\terrors\n2026-07-12\tcompleted\t10\t2\t1\t6\t1\t0\n2026-07-13\tpartial\t5\t0\t0\t4\t0\t1\n';
  const result = scanRunSummary(tsv);
  assert.equal(result.runs, 2);
  assert.equal(result.partial_runs, 1);
  assert.equal(result.total_actionable, 2);
  assert.equal(result.average_rejection_rate, 60);
});
