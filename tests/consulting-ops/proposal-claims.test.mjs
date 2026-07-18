import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { metricClaims, verifyProposalClaims, verifyWorkspace } from '../../verify-proposal-claims.mjs';

test('proposal claim validator flags unsupported metrics and accepts sourced metrics', () => {
  const draft = 'We supported 25 organizations and improved participation by 40% on a $2.2 million portfolio.';
  assert.deepEqual(metricClaims(draft), ['$2.2 million', '40%', '25 organizations']);
  const result = verifyProposalClaims(draft, ['Approved: 25 organizations and a $2.2 million portfolio.']);
  assert.equal(result.valid, false);
  assert.deepEqual(result.unsupported, ['40%']);
});

test('proposal workspace accepts client metrics preserved in its source folder', () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-claims-'));
  mkdirSync(join(root, 'source'));
  writeFileSync(join(root, 'proposal-draft.md'), 'The confirmed budget is $12,000.');
  writeFileSync(join(root, 'source', 'clarification.md'), 'Client confirmed a $12,000 budget.');
  const result = verifyWorkspace(root, { evidenceRoots: [join(root, 'source')] });
  assert.equal(result.valid, true);
  assert.deepEqual(result.unsupported, []);
});
