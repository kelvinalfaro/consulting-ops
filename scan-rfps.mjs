#!/usr/bin/env node

/** Portable RFP discovery. Supports manual, RSS/Atom, and JSON sources. */

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import yaml from 'js-yaml';
import { loadProviderPlugins, resolveProvider } from './providers/_registry.mjs';
import { matchesTerm } from './providers/_match.mjs';

const DEFAULT_CONFIG = 'config/rfp_sources.yml';
const DEFAULT_PIPELINE = 'data/rfp_pipeline.md';
const DEFAULT_RUNS = 'data/scan-runs.tsv';
export const SCAN_RUNS_HEADER = 'timestamp\tstatus\tscanned\tactionable\tsource_leads\trejected\tduplicates\terrors\n';

export function appendScanRun(stats, path = resolve(DEFAULT_RUNS), now = new Date()) {
  if (!existsSync(path)) writeFileSync(path, SCAN_RUNS_HEADER, 'utf8');
  const row = [now.toISOString(), stats.errors ? 'partial' : 'completed', stats.scanned, stats.actionable, stats.source_leads, stats.rejected, stats.duplicates, stats.errors].join('\t');
  appendFileSync(path, `${row}\n`, 'utf8');
  return path;
}

function decodeXml(value = '') {
  return repairText(value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim());
}

/** Repair the common UTF-8-as-Windows-1252/Latin-1 corruption returned by search feeds. */
export function repairText(value = '') {
  const text = String(value)
    .replaceAll('â€™', '’').replaceAll('â€˜', '‘')
    .replaceAll('â€œ', '“').replaceAll('â€', '”')
    .replaceAll('â€“', '–').replaceAll('â€”', '—')
    .replaceAll('â€¢', '•')
    .replaceAll('Â ', ' ');
  if (!/[\u00c2\u00c3\u00e2][\u0080-\u00bf\u2018-\u203a]?/.test(text)) return text;
  const repaired = Buffer.from(text, 'latin1').toString('utf8');
  return repaired.includes('\ufffd') ? text : repaired;
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return decodeXml(match?.[1] ?? '');
}

function atomLink(block) {
  const match = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return decodeXml(match?.[1] ?? tag(block, 'link'));
}

export function parseFeed(xml, source = {}) {
  const blocks = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  return blocks.map((block) => ({
    title: tag(block, 'title'),
    url: tag(block, 'link') || atomLink(block),
    issuer: tag(block, 'author') || tag(block, 'dc:creator') || source.label || source.id,
    published: tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || null,
    summary: tag(block, 'description') || tag(block, 'summary') || null,
    source_id: source.id,
  })).filter((item) => item.title && /^https?:\/\//i.test(item.url));
}

function getAt(value, path) {
  return String(path ?? '').split('.').filter(Boolean).reduce((current, key) => current?.[key], value);
}

export function parseJsonFeed(payload, source = {}) {
  const rows = getAt(payload, source.items_path ?? '') ?? payload;
  if (!Array.isArray(rows)) throw new Error(`JSON source ${source.id} did not resolve to an array`);
  const fields = source.fields ?? {};
  return rows.map((row) => ({
    title: getAt(row, fields.title ?? 'title'),
    url: getAt(row, fields.url ?? 'url'),
    issuer: getAt(row, fields.issuer ?? 'issuer') ?? source.label ?? source.id,
    published: getAt(row, fields.published ?? 'published') ?? null,
    summary: getAt(row, fields.summary ?? 'summary') ?? null,
    source_id: source.id,
  })).filter((item) => item.title && /^https?:\/\//i.test(item.url));
}

export function classifyItem(item, filters = {}) {
  const haystack = `${item.title} ${item.issuer} ${item.summary ?? ''}`.toLowerCase();
  const include = Array.isArray(filters.include_terms) ? filters.include_terms : [];
  const exclude = Array.isArray(filters.exclude_terms) ? filters.exclude_terms : [];
  const opportunityTerms = filters.opportunity_terms ?? [
    'rfp', 'rfq', 'request for proposal', 'request for qualification', 'solicitation',
    'invitation to bid', 'call for consultant', 'consulting opportunity',
    'current business opportunities', 'contract opportunities', 'current advertisements',
  ];
  const informationalPatterns = filters.informational_patterns ?? [
    'what is ', 'what a request', 'guide', 'explained', 'understanding the difference',
    'template', 'how the rfp process', 'rfp process works', 'rfq process',
    'writing the perfect', 'master the rfq', 'rfp vs', 'rfq vs',
  ];
  const domainTerms = filters.domain_terms ?? [
    'strategic planning', 'organizational development', 'organization development',
    'executive coaching', 'leadership', 'team development', 'facilitation',
    'facilitator', 'retreat', 'culture assessment', 'change management',
  ];
  const portalTerms = filters.portal_terms ?? [
    'current business opportunities', 'contract opportunities', 'current advertisements',
    'bid postings', 'government bids opportunities', 'goods & services rfps',
  ];
  const excludedDomains = filters.exclude_domains ?? ['wikipedia.org', 'investopedia.com', 'indeed.com/career-advice'];
  const included = !include.length || include.some((term) => matchesTerm(haystack, term));
  const excluded = exclude.some((term) => matchesTerm(haystack, term));
  const opportunityLike = opportunityTerms.some((term) => matchesTerm(haystack, term));
  const informational = informationalPatterns.some((term) => matchesTerm(haystack, term));
  const procurementPortal = portalTerms.some((term) => matchesTerm(haystack, term));
  const targetDomain = domainTerms.some((term) => matchesTerm(haystack, term));
  const excludedDomain = excludedDomains.some((domain) => item.url?.toLowerCase().includes(String(domain).toLowerCase()));
  const deadline = item.deadline ? new Date(item.deadline) : null;
  const expired = deadline && !Number.isNaN(deadline.valueOf()) && deadline < new Date(new Date().toISOString().slice(0, 10));
  if (excluded || informational || excludedDomain || expired) return 'reject';
  if (procurementPortal) return 'source_lead';
  if (!opportunityLike) return 'reject';
  if (!targetDomain && included) return 'source_lead';
  return targetDomain ? 'opportunity' : 'reject';
}

export function keywordMatch(item, filters = {}) {
  return classifyItem(item, filters) !== 'reject';
}

export function existingUrls(markdown) {
  return new Set(markdown.match(/https?:\/\/[^\s)>]+/g) ?? []);
}

function pipelineLines(items) {
  return items.map((item) => `- [ ] ${item.url} | ${repairText(item.issuer || 'Unknown issuer')} | ${repairText(item.title)}${item.deadline ? ` | due ${repairText(item.deadline)}` : item.published ? ` | published ${repairText(item.published)}` : ''}`).join('\n');
}

export function insertPending(markdown, items) {
  if (!items.length) return markdown;
  const lines = pipelineLines(items);
  const processed = /^## Processed\s*$/m;
  const match = processed.exec(markdown);
  if (!match) return `${markdown.trimEnd()}\n\n${lines}\n`;
  const before = markdown.slice(0, match.index).trimEnd();
  const after = markdown.slice(match.index).trimStart();
  return `${before}\n\n${lines}\n\n${after.trimEnd()}\n`;
}

export function insertSourceLeads(markdown, items) {
  if (!items.length) return markdown;
  const lines = pipelineLines(items);
  const heading = /^## Source leads\s*$/mi;
  const match = heading.exec(markdown);
  if (!match) {
    const processed = /^## Processed\s*$/m.exec(markdown);
    const block = `## Source leads\n\n${lines}\n\n`;
    return processed
      ? `${markdown.slice(0, processed.index).trimEnd()}\n\n${block}${markdown.slice(processed.index).trimStart()}`
      : `${markdown.trimEnd()}\n\n${block}`;
  }
  const afterHeading = match.index + match[0].length;
  const nextHeadingRelative = markdown.slice(afterHeading).search(/\n##\s+/);
  const sectionEnd = nextHeadingRelative < 0 ? markdown.length : afterHeading + nextHeadingRelative;
  return `${markdown.slice(0, sectionEnd).trimEnd()}\n\n${lines}\n${markdown.slice(sectionEnd)}`;
}

async function fetchSource(source, config = {}, providers = new Map()) {
  if (source.type === 'manual') return [];
  if (source.type === 'web_search') {
    const queries = (config.search_terms ?? []).slice(0, source.max_queries ?? 10);
    const results = [];
    for (const query of queries) {
      const url = `${source.endpoint ?? 'https://www.bing.com/search?format=rss&q='}${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { 'user-agent': 'consulting-ops/0.2 (+local RFP discovery)' },
        redirect: 'follow', signal: AbortSignal.timeout(source.timeout_ms ?? 20000) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      results.push(...parseFeed(await response.text(), { ...source, label: source.label ?? 'Web search' }));
    }
    return results;
  }
  const plugin = resolveProvider(providers, source.type);
  if (plugin) return plugin.fetch(source, { config, fetch, parseFeed, parseJsonFeed });
  if (!source.url) throw new Error(`Source ${source.id} requires url`);
  const response = await fetch(source.url, {
    headers: { 'user-agent': 'consulting-ops/0.2 (+local RFP discovery)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(source.timeout_ms ?? 20000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  if (source.type === 'rss' || source.type === 'atom') return parseFeed(await response.text(), source);
  if (source.type === 'json') return parseJsonFeed(await response.json(), source);
  throw new Error(`Unsupported source type: ${source.type}`);
}

export async function scan(config, options = {}) {
  const pipelinePath = resolve(options.pipelinePath ?? DEFAULT_PIPELINE);
  const current = existsSync(pipelinePath) ? readFileSync(pipelinePath, 'utf8') : '# RFP pipeline\n\n## Pending\n\n## Processed\n';
  const seen = existingUrls(current);
  const providers = options.providers ?? await loadProviderPlugins(options.providerRoots ?? ['providers', 'plugins.local']);
  const found = [];
  const sourceLeads = [];
  const errors = [];
  let scanned = 0;
  let rejected = 0;
  let duplicates = 0;
  for (const source of config.sources ?? []) {
    if (source.enabled === false) continue;
    try {
      const items = await fetchSource(source, config, providers);
      for (const item of items) {
        scanned += 1;
        const classification = classifyItem(item, config.filters);
        if (classification === 'reject') { rejected += 1; continue; }
        if (seen.has(item.url)) { duplicates += 1; continue; }
        if (!seen.has(item.url)) {
          seen.add(item.url);
          if (classification === 'opportunity') found.push(item);
          else sourceLeads.push(item);
        }
      }
    } catch (error) {
      errors.push({ source: source.id, error: error.message });
    }
  }
  if ((found.length || sourceLeads.length) && !options.dryRun) {
    writeFileSync(pipelinePath, insertSourceLeads(insertPending(current, found), sourceLeads), 'utf8');
  }
  const stats = { scanned, actionable: found.length, source_leads: sourceLeads.length, rejected, duplicates, errors: errors.length };
  if (!options.dryRun) appendScanRun(stats, resolve(options.runsPath ?? join(dirname(pipelinePath), 'scan-runs.tsv')), options.now ?? new Date());
  return { found, sourceLeads, errors, stats, dryRun: Boolean(options.dryRun) };
}

async function main() {
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');
  const configPath = resolve(configIndex >= 0 && args[configIndex + 1] ? args[configIndex + 1] : DEFAULT_CONFIG);
  if (!existsSync(configPath)) {
    console.error(`RFP source configuration not found: ${configPath}\nCopy config/rfp_sources.example.yml to config/rfp_sources.yml and add sources.`);
    process.exit(1);
  }
  const config = yaml.load(readFileSync(configPath, 'utf8')) ?? {};
  const result = await scan(config, { dryRun: args.includes('--dry-run') });
  console.log(JSON.stringify({ new_opportunities: result.found.length, ...result }, null, 2));
  if (result.errors.length) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
