import test from 'node:test';
import assert from 'node:assert/strict';
import { existingUrls, parseFeed, parseJsonFeed } from '../../scan-rfps.mjs';

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
