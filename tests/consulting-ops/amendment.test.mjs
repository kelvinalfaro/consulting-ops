import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { addAmendment } from '../../add-amendment.mjs';
import { buildOpportunity } from '../../capture-rfp.mjs';

test('amendment capture preserves source and flags changed deadline for review', async () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-ops-amend-'));
  try {
    const record = join(root, 'opportunity.yml');
    const opportunity = buildOpportunity({ id: 'RFP-1', sourceFile: 'source.txt' });
    opportunity.proposal_due = '2027-08-01T17:00:00.000Z';
    writeFileSync(record, yaml.dump(opportunity));
    const source = join(root, 'notice.txt');
    writeFileSync(source, 'Amendment 1\nProposals Due: August 15, 2027 5:00 PM UTC');
    const result = await addAmendment(record, source);
    assert.ok(result.candidate_changes.proposal_due);
    const updated = yaml.load(readFileSync(record, 'utf8'));
    assert.equal(updated.amendment_review_required, true);
    assert.equal(updated.amendments[0].review_status, 'pending');
    assert.match(updated.amendments[0].sha256, /^[a-f0-9]{64}$/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
