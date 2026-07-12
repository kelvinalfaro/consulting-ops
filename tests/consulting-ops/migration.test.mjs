import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inspectCareerMigration } from '../../migrate-career-ops.mjs';

test('career migration helper inventories without copying career data into consulting sources', () => {
  const root = mkdtempSync(join(tmpdir(), 'career-migration-'));
  mkdirSync(join(root, 'config')); mkdirSync(join(root, 'data'));
  writeFileSync(join(root, 'cv.md'), '# CV'); writeFileSync(join(root, 'config', 'profile.yml'), 'candidate: {}');
  writeFileSync(join(root, 'data', 'applications.md'), '# Applications');
  const output = join(root, 'review.md');
  const result = inspectCareerMigration(root, { output });
  assert.equal(result.files_copied, 0);
  assert.equal(result.files_found, 3);
  const text = readFileSync(output, 'utf8');
  assert.match(text, /Do not import into the RFP tracker/);
  assert.match(text, /exact diffs/i);
});
