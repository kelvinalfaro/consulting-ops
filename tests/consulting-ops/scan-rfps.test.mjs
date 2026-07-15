import test from 'node:test';
import assert from 'node:assert/strict';
import { appendScanRun, classifyItem, existingUrls, insertPending, insertSourceLeads, keywordMatch, parseFeed, parseIssuerBlacklist, parseJsonFeed, repairText, SCAN_RUNS_HEADER } from '../../scan-rfps.mjs';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

test('parses RSS opportunities', () => {
  const result = parseFeed('<rss><channel><item><title>Strategic Planning RFP</title><link>https://example.org/rfp/1</link><description>Consulting</description></item></channel></rss>', { id: 'feed', label: 'Agency' });
  assert.equal(result.length, 1);
  assert.equal(result[0].issuer, 'Agency');
});

test('parses configured JSON paths', () => {
  const result = parseJsonFeed({ results: [{ name: 'Coaching RFQ', href: 'https://example.org/2', agency: 'City' }] }, {
    id: 'api', items_path: 'results', fields: { title: 'name', url: 'href', issuer: 'agency' },
  });
  assert.deepEqual(result.map(({ title, issuer }) => ({ title, issuer })), [{ title: 'Coaching RFQ', issuer: 'City' }]);
});

test('finds URLs already present in pipeline', () => {
  assert.ok(existingUrls('- [ ] https://example.org/rfp/1 | Agency').has('https://example.org/rfp/1'));
});

test('repairs mojibake in feed text', () => {
  assert.equal(repairText('Whatâ€™s new'), 'What’s new');
});

test('rejects informational articles while retaining live opportunity and portal leads', () => {
  const filters = { include_terms: ['consulting', 'rfp'] };
  assert.equal(keywordMatch({ title: 'What is an RFP? A complete guide', issuer: 'Blog', url: 'https://example.org/article' }, filters), false);
  assert.equal(classifyItem({ title: 'RFP 24-10 Strategic Planning Consulting Services', issuer: 'City', url: 'https://city.gov/rfp' }, filters), 'opportunity');
  assert.equal(classifyItem({ title: 'Current Business Opportunities', issuer: 'State procurement', url: 'https://state.gov/bids' }, filters), 'source_lead');
  assert.equal(classifyItem({ title: 'Strategic Planning RFP', issuer: 'City', url: 'https://city.gov/old', deadline: 'January 1, 2020' }, filters), 'reject');
});

test('inserts new scan records under Pending and before Processed', () => {
  const pipeline = '# RFP pipeline\n\n## Pending\n\n## Processed\n\n- [x] old';
  const result = insertPending(pipeline, [{ url: 'https://example.org/rfp', issuer: 'City', title: 'Strategic Planning RFP' }]);
  assert.ok(result.indexOf('https://example.org/rfp') > result.indexOf('## Pending'));
  assert.ok(result.indexOf('https://example.org/rfp') < result.indexOf('## Processed'));
});

test('keeps source leads outside the actionable Pending section', () => {
  const pipeline = '# RFP pipeline\n\n## Pending\n\n## Processed\n';
  const result = insertSourceLeads(pipeline, [{ url: 'https://example.org/bids', issuer: 'State', title: 'Contract Opportunities' }]);
  assert.ok(result.indexOf('## Source leads') > result.indexOf('## Pending'));
  assert.ok(result.indexOf('https://example.org/bids') > result.indexOf('## Source leads'));
  assert.ok(result.indexOf('https://example.org/bids') < result.indexOf('## Processed'));
});

test('scan run history appends an auditable row with a single header', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'scan-runs-')), 'runs.tsv');
  const stats = { scanned: 10, actionable: 2, source_leads: 1, rejected: 6, duplicates: 1, errors: 0 };
  appendScanRun(stats, path, new Date('2026-07-12T12:00:00Z'));
  appendScanRun({ ...stats, errors: 1 }, path, new Date('2026-07-13T12:00:00Z'));
  const lines = readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean);
  assert.equal(lines[0], SCAN_RUNS_HEADER.trim());
  assert.equal(lines.length, 3);
  assert.match(lines[2], /\tpartial\t/);
});

test('freshness and private issuer blacklist filters reject stale or do-not-bid opportunities', () => {
  const filters = { include_terms: ['consulting'], max_posting_age_days: 30, blacklist_issuers: ['Blocked Agency'] };
  assert.equal(classifyItem({ title: 'Strategic Planning Consulting RFP', issuer: 'City', url: 'https://city.gov/old', published: '2020-01-01' }, filters), 'reject');
  assert.equal(classifyItem({ title: 'Strategic Planning Consulting RFP', issuer: 'Blocked Agency', url: 'https://agency.gov/rfp' }, filters), 'reject');
  assert.deepEqual(parseIssuerBlacklist('# Do not bid\n\n- Blocked Agency\n- [ ] Another Issuer'), ['Blocked Agency', 'Another Issuer']);
});
