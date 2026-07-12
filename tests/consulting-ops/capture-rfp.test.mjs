import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOpportunity } from '../../capture-rfp.mjs';

test('capture skeleton preserves source and leaves unknown procurement facts unknown', () => {
  const record = buildOpportunity({ id: 'RFP-1', sourceUrl: 'https://example.org/rfp' });
  assert.equal(record.source_url, 'https://example.org/rfp');
  assert.equal(record.proposal_due, null);
  assert.equal(record.terms_status, 'unknown');
  assert.deepEqual(record.mandatory_requirements, []);
});
