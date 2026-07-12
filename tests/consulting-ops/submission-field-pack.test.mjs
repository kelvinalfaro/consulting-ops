import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSubmissionFieldPack } from '../../submission-field-pack.mjs';

test('builds a portal field pack and preserves the stop-before-submit gate', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'submission-fields-'));
  writeFileSync(join(workspace, 'compliance-matrix.md'), '| ID | Requirement | Source | Status |\n|---|---|---|---|\n| C-1 | Upload technical proposal | p. 4 | Open |\n', 'utf8');
  writeFileSync(join(workspace, 'proposal-draft.md'), '# Draft\n', 'utf8');
  const result = buildSubmissionFieldPack(workspace);
  assert.equal(result.submission_performed, false);
  assert.equal(result.requirements_mapped, 1);
  const text = readFileSync(result.path, 'utf8');
  assert.match(text, /Submit, Send, Certify, Sign/);
  assert.match(text, /Upload technical proposal/);
});
