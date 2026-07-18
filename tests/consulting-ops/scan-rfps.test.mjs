import test from 'node:test';
import assert from 'node:assert/strict';
import { appendScanRun, appendSourceHealth, canonicalizeUrl, classifyItem, classifyItemDetailed, existingFingerprints, existingUrls, insertPending, insertSourceLeads, keywordMatch, loadSourceHealth, mergeSourceFilters, opportunityFingerprint, parseFeed, parseIssuerBlacklist, parseJsonFeed, repairText, scan, SCAN_RUNS_HEADER, SOURCE_HEALTH_HEADER, sourceFailureStreaks } from '../../scan-rfps.mjs';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
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

test('canonicalizes tracking variants and fingerprints issuer-title-deadline duplicates', () => {
  assert.equal(canonicalizeUrl('https://example.org/rfp/?utm_source=email&b=2&a=1#details'), 'https://example.org/rfp?a=1&b=2');
  const first = opportunityFingerprint({ issuer: 'Example City', title: 'Strategic Planning RFP', deadline: 'August 1, 2026' });
  const second = opportunityFingerprint({ issuer: 'EXAMPLE CITY', title: 'Strategic-planning RFP', deadline: 'August 1 2026' });
  assert.equal(first, second);
  assert.ok(existingFingerprints('- [ ] https://example.org/rfp | Example City | Strategic Planning RFP | due August 1, 2026').has(first));
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

test('classification exposes confidence and stable reasons without treating RFP as service fit', () => {
  assert.deepEqual(
    classifyItemDetailed({ title: 'Strategic Planning RFP', issuer: 'City', url: 'https://city.gov/rfp' }),
    { classification: 'opportunity', confidence: 95, reason_codes: ['solicitation_signal', 'service_fit'] },
  );
  assert.equal(
    classifyItemDetailed({ title: 'Road construction RFP', issuer: 'City', url: 'https://city.gov/roads' }, { include_terms: ['RFP'] }).classification,
    'source_lead',
  );
  assert.deepEqual(
    classifyItemDetailed({ title: 'What is an RFQ? A guide', issuer: 'Blog', url: 'https://example.org/guide' }).reason_codes,
    ['informational_content'],
  );
});

test('source filters override global fit vocabulary while preserving blacklist entries', () => {
  const filters = mergeSourceFilters(
    { domain_terms: ['strategic planning'], blacklist_issuers: ['Blocked Agency'] },
    { domain_terms: ['board development'], blacklist_issuers: ['Second Agency'] },
  );
  assert.deepEqual(filters.domain_terms, ['board development']);
  assert.deepEqual(filters.blacklist_issuers, ['Blocked Agency', 'Second Agency']);
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

test('source health persists failure streaks, resets on recovery, and keeps one header', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'source-health-')), 'health.tsv');
  appendSourceHealth([{ source: 'portal', status: 'network', detail: 'timeout' }], path, new Date('2026-07-12T12:00:00Z'));
  appendSourceHealth([{ source: 'portal', status: 'network', detail: 'timeout' }], path, new Date('2026-07-13T12:00:00Z'));
  appendSourceHealth([{ source: 'portal', status: 'reachable', detail: '2 items' }], path, new Date('2026-07-14T12:00:00Z'));
  const records = loadSourceHealth(path);
  assert.equal(readFileSync(path, 'utf8').split(/\r?\n/)[0], SOURCE_HEALTH_HEADER.trim());
  assert.deepEqual(records.map((record) => record.failure_streak), [1, 2, 0]);
  assert.equal(sourceFailureStreaks(records).get('portal'), 0);
});

test('scan deduplicates canonical and fingerprint variants and dry-run writes nothing', async () => {
  const root = mkdtempSync(join(tmpdir(), 'scan-quality-'));
  const pipelinePath = join(root, 'rfp_pipeline.md');
  const healthPath = join(root, 'source-health.tsv');
  const providers = new Map([['fixture', { async fetch() {
    return [
      { title: 'Strategic Planning RFP', issuer: 'Example City', url: 'https://example.test/rfp?utm_source=feed' },
      { title: 'Strategic-planning RFP', issuer: 'EXAMPLE CITY', url: 'https://example.test/rfp/' },
      { title: 'What is an RFP? A guide', issuer: 'Blog', url: 'https://example.test/guide' },
    ];
  } }]]);
  const result = await scan({ sources: [{ id: 'fixture', type: 'fixture' }] }, { providers, pipelinePath, healthPath, dryRun: true });
  assert.equal(result.found.length, 1);
  assert.equal(result.stats.duplicates, 1);
  assert.equal(result.stats.rejected, 1);
  assert.equal(existsSync(pipelinePath), false);
  assert.equal(existsSync(healthPath), false);
});

test('scan marks a source persistently failed after three consecutive runs', async () => {
  const root = mkdtempSync(join(tmpdir(), 'scan-health-threshold-'));
  const pipelinePath = join(root, 'rfp_pipeline.md');
  const healthPath = join(root, 'source-health.tsv');
  const runsPath = join(root, 'scan-runs.tsv');
  const providers = new Map([['broken', { async fetch() { throw new Error('network timeout'); } }]]);
  let result;
  for (let day = 1; day <= 3; day += 1) {
    result = await scan(
      { source_health_threshold: 3, sources: [{ id: 'broken-source', type: 'broken' }] },
      { providers, pipelinePath, healthPath, runsPath, now: new Date(`2026-07-0${day}T12:00:00Z`) },
    );
  }
  assert.equal(result.sourceHealth[0].failure_streak, 3);
  assert.equal(result.sourceHealth[0].persistent_failure, true);
});

test('freshness and private issuer blacklist filters reject stale or do-not-bid opportunities', () => {
  const filters = { include_terms: ['consulting'], max_posting_age_days: 30, blacklist_issuers: ['Blocked Agency'] };
  assert.equal(classifyItem({ title: 'Strategic Planning Consulting RFP', issuer: 'City', url: 'https://city.gov/old', published: '2020-01-01' }, filters), 'reject');
  assert.equal(classifyItem({ title: 'Strategic Planning Consulting RFP', issuer: 'Blocked Agency', url: 'https://agency.gov/rfp' }, filters), 'reject');
  assert.deepEqual(parseIssuerBlacklist('# Do not bid\n\n- Blocked Agency\n- [ ] Another Issuer'), ['Blocked Agency', 'Another Issuer']);
});
