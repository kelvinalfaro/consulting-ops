import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkLiveness, deduplicateTracker, findTracker, inboxSummary, qualityCheck, reconcilePipeline, verifyTracker } from '../../operational-tools.mjs';

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
  const pipeline = '# Pipeline\n- [ ] https://example.test/one\n- [ ] https://example.test/two\n';
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
