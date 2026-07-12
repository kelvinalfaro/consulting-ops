import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHtmlLinks } from '../../providers/html_links.mjs';
import { matchesTerm } from '../../providers/_match.mjs';

test('HTML link provider extracts, resolves, filters, decodes, and deduplicates procurement links', () => {
  const html = `<p>Current opportunities</p><a href="/rfp/42?x=1&amp;y=2">Strategic Planning RFP</a><a href="/about">About</a><a href="/rfp/42?x=1&amp;y=2">Strategic Planning RFP duplicate</a>`;
  const rows = parseHtmlLinks(html, { id: 'city', label: 'City', url: 'https://city.example/bids/', link_include_terms: ['strategic planning'] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].url, 'https://city.example/rfp/42?x=1&y=2');
  assert.equal(rows[0].issuer, 'City');
});

test('term matching does not confuse culture with aquaculture', () => {
  assert.equal(matchesTerm('organizational culture assessment', 'culture'), true);
  assert.equal(matchesTerm('licensed aquaculture facility', 'culture'), false);
});

test('HTML provider extracts a response deadline from a procurement table row', () => {
  const html = `<table><tr><td>Strategic planning facilitation</td><td>Response Due Date: August 20, 2026</td><td><a href="/files/42.pdf">Bid Documents</a></td></tr></table>`;
  const rows = parseHtmlLinks(html, { id: 'city', url: 'https://city.example/bids', context_filter: true, link_include_terms: ['strategic planning'] });
  assert.equal(rows[0].deadline, 'August 20, 2026');
});
