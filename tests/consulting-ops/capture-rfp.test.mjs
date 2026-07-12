import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { buildOpportunity, captureSource } from '../../capture-rfp.mjs';

test('capture skeleton preserves source and leaves unknown procurement facts unknown', () => {
  const record = buildOpportunity({ id: 'RFP-1', sourceUrl: 'https://example.org/rfp' });
  assert.equal(record.source_url, 'https://example.org/rfp');
  assert.equal(record.proposal_due, null);
  assert.equal(record.terms_status, 'unknown');
  assert.deepEqual(record.mandatory_requirements, []);
});

test('capture rejects a duplicate solicitation URL even when a new ID is proposed', async () => {
  const root = mkdtempSync(join(tmpdir(), 'duplicate-rfp-'));
  const folder = join(root, 'rfp-1');
  const { mkdirSync } = await import('node:fs');
  mkdirSync(folder);
  writeFileSync(join(folder, 'opportunity.yml'), yaml.dump(buildOpportunity({ id: 'RFP-1', sourceUrl: 'https://example.org/rfp/' })));
  await assert.rejects(() => captureSource('https://EXAMPLE.org/rfp#details', { id: 'RFP-2', outputRoot: root }), /already captured/);
  const reused = await captureSource('https://example.org/rfp', { id: 'RFP-2', outputRoot: root, reuse: true });
  assert.equal(reused.duplicate_url, true);
});
