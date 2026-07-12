import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkspaceFiles, slug } from '../../generate-proposal-draft.mjs';

test('proposal workspace begins with compliance and human review controls', () => {
  const files = buildWorkspaceFiles({
    id: 'RFP 42', title: 'Facilitation', issuer: 'County', source_url: 'https://example.org/rfp',
    mandatory_requirements: [{ name: 'Three references', status: 'unknown', source: 'p. 8' }],
  }, { firm: { name: 'Example Consulting' } });
  assert.match(files['compliance-matrix.md'], /Three references/);
  assert.match(files['proposal-draft.md'], /Human review required/);
  assert.match(files['review-checklist.md'], /User performs the final submission/);
});

test('workspace slug is filesystem-safe', () => {
  assert.equal(slug('RFP 42: Strategy/Coaching'), 'rfp-42-strategy-coaching');
});
