import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createPursuitArtifact } from '../../pursuit-artifact.mjs';

test('creates guarded pursuit artifacts for every supported mode', () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-artifacts-'));
  const opportunity = { id: 'RFP-7', title: 'Planning support', issuer: 'Example Agency', source_url: 'https://example.test/rfp' };
  for (const mode of ['contact', 'email', 'contract', 'finalist', 'evidence', 'letter', 'finalist-plan', 'finalist-practice', 'finalist-debrief']) {
    const path = createPursuitArtifact(mode, opportunity, join(root, `${mode}.md`));
    const content = readFileSync(path, 'utf8');
    assert.match(content, /Planning support/);
    assert.match(content, /review|verify|verified|reviewing|confirm|evidence|debrief/i);
  }
});
