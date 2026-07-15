import test from 'node:test';
import assert from 'node:assert/strict';
import { metricClaims, verifyProposalClaims } from '../../verify-proposal-claims.mjs';

test('proposal claim validator flags unsupported metrics and accepts sourced metrics', () => {
  const draft = 'We supported 25 organizations and improved participation by 40% on a $2.2 million portfolio.';
  assert.deepEqual(metricClaims(draft), ['$2.2 million', '40%', '25 organizations']);
  const result = verifyProposalClaims(draft, ['Approved: 25 organizations and a $2.2 million portfolio.']);
  assert.equal(result.valid, false);
  assert.deepEqual(result.unsupported, ['40%']);
});
