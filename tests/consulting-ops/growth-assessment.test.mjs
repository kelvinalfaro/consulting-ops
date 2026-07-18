import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createGrowthAssessment } from '../../growth-assessment.mjs';

for (const mode of ['training', 'service', 'adjacent', 'jurisdiction']) {
  test(`creates a source-bounded ${mode} assessment`, () => {
    const output = join(mkdtempSync(join(tmpdir(), `consulting-${mode}-`)), `${mode}.md`);
    const result = createGrowthAssessment(mode, 'Facilitation credential', { output });
    assert.equal(result.decision, 'Needs evidence');
    const text = readFileSync(output, 'utf8');
    assert.match(text, /Evidence boundary/);
    assert.match(text, /smallest bounded test/);
    assert.match(text, /Should the consulting firm invest/);
    assert.doesNotMatch(text, /Alfaro Consulting/);
  });
}

test('uses an explicitly configured firm name', () => {
  const output = join(mkdtempSync(join(tmpdir(), 'consulting-firm-name-')), 'service.md');
  createGrowthAssessment('service', 'Strategy facilitation', { output, firmName: 'Example Consulting LLC' });
  assert.match(readFileSync(output, 'utf8'), /Should Example Consulting LLC invest/);
});
