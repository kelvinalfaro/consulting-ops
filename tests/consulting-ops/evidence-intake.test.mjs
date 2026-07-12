import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stageEvidenceIntake } from '../../evidence-intake.mjs';

test('stages new evidence without treating it as approved', () => {
  const root = mkdtempSync(join(tmpdir(), 'evidence-intake-'));
  const source = join(root, 'case.md');
  const output = join(root, 'intake.md');
  writeFileSync(source, '# Draft case\nReduced cycle time by 20 percent.', 'utf8');
  const result = stageEvidenceIntake(source, { output });
  assert.equal(result.approved, false);
  const text = readFileSync(output, 'utf8');
  assert.match(text, /not approved for proposal claims/i);
  assert.match(text, /exact destination diff/i);
});
