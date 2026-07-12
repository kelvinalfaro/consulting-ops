import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { runAutoPipeline } from '../../auto-pipeline.mjs';
import { buildOpportunity } from '../../capture-rfp.mjs';

test('auto pipeline extracts, evaluates, tracks, and creates proposal only for a Bid', async () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-ops-auto-'));
  try {
    const folder = join(root, 'record'); mkdirSync(folder);
    writeFileSync(join(folder, 'source.txt'), 'Request for Proposals: Facilitation\nIssued by: Example City\nProposals Due: August 15, 2027\nScope of Work\nFacilitate a planning retreat.');
    const opportunity = buildOpportunity({ id: 'RFP-TEST', sourceFile: 'source.txt' });
    Object.assign(opportunity, { capacity_status: 'available', terms_status: 'acceptable', scope_status: 'within' });
    opportunity.assessment.scores = Object.fromEntries(Object.keys(opportunity.assessment.scores).map((key) => [key, 4.5]));
    const record = join(folder, 'opportunity.yml'); writeFileSync(record, yaml.dump(opportunity));
    const result = await runAutoPipeline(record, { trackerPath: join(root, 'tracker.md'), reportsRoot: join(root, 'reports'),
      proposalsRoot: join(root, 'proposals') });
    assert.equal(result.evaluation.decision, 'Bid');
    assert.ok(result.proposal);
    assert.match(readFileSync(join(root, 'tracker.md'), 'utf8'), /\| Bid \|/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('auto pipeline does not create proposal when hard gates are unknown', async () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-ops-auto-'));
  try {
    const folder = join(root, 'record'); mkdirSync(folder);
    writeFileSync(join(folder, 'source.txt'), 'Request for Proposals: Coaching\nIssued by: Example City');
    const opportunity = buildOpportunity({ id: 'RFP-UNKNOWN', sourceFile: 'source.txt' });
    const record = join(folder, 'opportunity.yml'); writeFileSync(record, yaml.dump(opportunity));
    const result = await runAutoPipeline(record, { trackerPath: join(root, 'tracker.md'), reportsRoot: join(root, 'reports'),
      proposalsRoot: join(root, 'proposals') });
    assert.equal(result.evaluation.decision, 'Needs Clarification');
    assert.equal(result.proposal, null);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
