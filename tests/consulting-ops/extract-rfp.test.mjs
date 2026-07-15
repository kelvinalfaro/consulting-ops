import test from 'node:test';
import assert from 'node:assert/strict';
import { extractOpportunityFields, htmlToText, mergeExtractedFields } from '../../lib/extract-rfp.mjs';
import { extractRecord } from '../../extract-rfp.mjs';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

test('extracts core procurement fields from solicitation text', () => {
  const text = `REQUEST FOR PROPOSALS: Strategic Planning Services
Issued by: Example County
Questions Due: August 1, 2027 5:00 PM CDT
Proposals Due: August 15, 2027 5:00 PM CDT
Budget: $75,000
Scope of Work
Facilitate an inclusive planning process and deliver a three-year strategic plan.
The consultant must provide three client references.
Submit the cost proposal form by email to procurement@example.gov.
Evaluation criteria: Relevant experience 30%`;
  const value = extractOpportunityFields(text);
  assert.equal(value.title, 'Strategic Planning Services');
  assert.equal(value.issuer, 'Example County');
  assert.equal(value.budget.amount, 75000);
  assert.match(value.submission.contact, /procurement@example\.gov/);
  assert.ok(value.mandatory_requirements.some((item) => /three client references/i.test(item.name)));
  assert.ok(value.proposal_due);
});

test('HTML conversion removes scripts and retains paragraph breaks', () => {
  const text = htmlToText('<p>RFP</p><script>ignore()</script><div>Due Friday</div>');
  assert.match(text, /RFP/);
  assert.match(text, /Due Friday/);
  assert.doesNotMatch(text, /ignore/);
});

test('merge preserves reviewed fields over machine extraction', () => {
  const result = mergeExtractedFields({ title: 'Reviewed title', submission: {}, mandatory_requirements: [] }, {
    title: 'Machine title', submission: {}, mandatory_requirements: [], required_attachments: [], evaluation_criteria: [], extraction: {},
  });
  assert.equal(result.title, 'Reviewed title');
});

test('configurable analysis cap preserves the full authoritative source text', async () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-extract-cap-'));
  const recordDir = join(root, 'RFP-1');
  mkdirSync(recordDir);
  const source = 'REQUEST FOR PROPOSALS\n' + 'x'.repeat(5000);
  writeFileSync(join(recordDir, 'source.md'), source);
  writeFileSync(join(recordDir, 'opportunity.yml'), 'id: RFP-1\nsource_file: source.md\n');
  const result = await extractRecord(join(recordDir, 'opportunity.yml'), { maxChars: 100 });
  assert.equal(readFileSync(result.source_text, 'utf8'), source);
  assert.equal(result.opportunity.extraction.analyzed_characters, 100);
  assert.equal(result.opportunity.extraction.truncated_for_analysis, true);
});
