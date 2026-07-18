import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { compareOpportunities } from '../../compare-rfps.mjs';
import { createResearchBrief } from '../../client-research.mjs';
import { followupCandidates } from '../../followup.mjs';
import { analyzeOutcomes } from '../../analyze-outcomes.mjs';
import { compareVersions, GITHUB_INSTALL_COMMAND } from '../../update-system.mjs';
import { recordDebrief } from '../../debrief.mjs';
import { renderTracker } from '../../lib/rfp-tracker.mjs';

function viable(id, score = 4) {
  return {
    id, issuer: `${id} Agency`, title: `${id} Strategic Planning`, proposal_due: '2099-01-01',
    mandatory_requirements: [{ name: 'Eligibility', status: 'met' }], capacity_status: 'available',
    terms_status: 'acceptable', scope_status: 'within', assessment: { scores: {
      capability_fit: score, client_mission_fit: score, approach_differentiation: score,
      capacity_feasibility: score, commercial_attractiveness: score,
      procurement_win_conditions: score, strategic_value: score,
    } },
  };
}

test('compare ranks viable pursuits using the bid/no-bid model', () => {
  const root = mkdtempSync(join(tmpdir(), 'compare-rfps-'));
  const high = join(root, 'high.yml'); const low = join(root, 'low.yml');
  writeFileSync(high, yaml.dump(viable('HIGH', 5))); writeFileSync(low, yaml.dump(viable('LOW', 2)));
  const result = compareOpportunities([low, high]);
  assert.equal(result[0].id, 'HIGH');
});

test('research creates a source-marked issuer brief', () => {
  const root = mkdtempSync(join(tmpdir(), 'research-rfp-'));
  const record = join(root, 'record.yml');
  writeFileSync(record, yaml.dump({ id: 'RFP-9', issuer: 'City', title: 'Planning', source_url: 'https://example.test/rfp' }));
  const result = createResearchBrief(record, join(root, 'proposals'));
  assert.match(readFileSync(result.path, 'utf8'), /Authoritative source.*example\.test/s);
});

test('followup and outcome patterns preserve cadence and small-sample cautions', () => {
  const rows = [{ status: 'Submitted', last_activity: '2026-01-01', issuer: 'City', opportunity: 'RFP' }];
  assert.equal(followupCandidates(rows, new Date('2026-01-10')).length, 1);
  const patterns = analyzeOutcomes([{ status: 'Won' }, { status: 'Lost' }], 'date\tid\toutcome\treason\n2026-01-01\t1\tLost\tPrice\n');
  assert.equal(patterns.win_rate, 50);
  assert.equal(patterns.small_sample, true);
});

test('debrief records evidence and updates a caller-scoped tracker', () => {
  const root = mkdtempSync(join(tmpdir(), 'debrief-rfp-'));
  const tracker = join(root, 'tracker.md');
  writeFileSync(tracker, renderTracker([{ '#': '1', identified: '2026-01-01', issuer: 'City', opportunity: 'Planning', status: 'Submitted', notes: 'RFP-1' }]));
  const result = recordDebrief('RFP-1', 'Lost', { reason: 'Price' }, join(root, 'debriefs.tsv'), tracker);
  assert.equal(result.outcome, 'Lost');
  assert.match(readFileSync(tracker, 'utf8'), /\| Lost \|/);
});

test('update version comparison handles upgrades, equality, and local-ahead versions', () => {
  assert.equal(compareVersions('1.2.0', '1.1.9'), 1);
  assert.equal(compareVersions('v1.2.0', '1.2.0'), 0);
  assert.equal(compareVersions('1.1.9', '1.2.0'), -1);
});

test('non-Git installs point updates back to the public GitHub repository', () => {
  assert.equal(GITHUB_INSTALL_COMMAND, 'npm install --global github:kelvinalfaro/consulting-ops');
});
