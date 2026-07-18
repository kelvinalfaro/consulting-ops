#!/usr/bin/env node

/** Portable RFP discovery. Supports manual, RSS/Atom, and JSON sources. */

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import yaml from 'js-yaml';
import { loadProviderPlugins, resolveProvider } from './providers/_registry.mjs';
import { matchesTerm } from './providers/_match.mjs';

const DEFAULT_CONFIG = 'config/rfp_sources.yml';
const DEFAULT_PIPELINE = 'data/rfp_pipeline.md';
const DEFAULT_RUNS = 'data/scan-runs.tsv';
const SYSTEM_ROOT = dirname(fileURLToPath(import.meta.url));
export const SCAN_RUNS_HEADER = 'timestamp\tstatus\tscanned\tactionable\tsource_leads\trejected\tduplicates\terrors\n';
export const SOURCE_HEALTH_HEADER = 'timestamp\tsource\tstatus\tfailure_streak\tdetail\n';

export function defaultProviderRoots(workspace = process.cwd()) {
  return [join(SYSTEM_ROOT, 'providers'), resolve(workspace, 'plugins.local')];
}

export function appendScanRun(stats, path = resolve(DEFAULT_RUNS), now = new Date()) {
  if (!existsSync(path)) writeFileSync(path, SCAN_RUNS_HEADER, 'utf8');
  const row = [now.toISOString(), stats.errors ? 'partial' : 'completed', stats.scanned, stats.actionable, stats.source_leads, stats.rejected, stats.duplicates, stats.errors].join('\t');
  appendFileSync(path, `${row}\n`, 'utf8');
  return path;
}

function cleanTsv(value = '') {
  return String(value ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

export function loadSourceHealth(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    const [timestamp, source, status, failureStreak, detail = ''] = line.split('\t');
    return { timestamp, source, status, failure_streak: Number(failureStreak) || 0, detail };
  });
}

export function sourceFailureStreaks(records = []) {
  const streaks = new Map();
  for (const record of records) {
    const failure = ['network', 'configuration', 'authorization_required'].includes(record.status);
    streaks.set(record.source, failure ? (streaks.get(record.source) ?? 0) + 1 : 0);
  }
  return streaks;
}

export function appendSourceHealth(records, path, now = new Date()) {
  if (!records.length) return path;
  if (!existsSync(path)) writeFileSync(path, SOURCE_HEALTH_HEADER, 'utf8');
  const previous = sourceFailureStreaks(loadSourceHealth(path));
  const rows = records.map((record) => {
    const failure = ['network', 'configuration', 'authorization_required'].includes(record.status);
    const failureStreak = failure ? (previous.get(record.source) ?? 0) + 1 : 0;
    previous.set(record.source, failureStreak);
    return [now.toISOString(), record.source, record.status, failureStreak, record.detail ?? ''].map(cleanTsv).join('\t');
  });
  appendFileSync(path, `${rows.join('\n')}\n`, 'utf8');
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

export function classifyItemDetailed(item, filters = {}, now = new Date()) {
  const haystack = `${item.title} ${item.issuer} ${item.summary ?? ''}`.toLowerCase();
  const include = Array.isArray(filters.include_terms) ? filters.include_terms : [];
  const exclude = Array.isArray(filters.exclude_terms) ? filters.exclude_terms : [];
  const opportunityTerms = filters.opportunity_terms ?? [
    'rfp', 'rfq', 'request for proposal', 'request for qualification', 'solicitation',
    'invitation to bid', 'call for consultant', 'consulting opportunity', 'sourcing event',
    'obtaining bids', 'bids must be submitted', 'completed bids must',
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
  const blacklistedIssuers = filters.blacklist_issuers ?? [];
  const included = !include.length || include.some((term) => matchesTerm(haystack, term));
  const excluded = exclude.some((term) => matchesTerm(haystack, term));
  const opportunityLike = opportunityTerms.some((term) => matchesTerm(haystack, term));
  const informational = informationalPatterns.some((term) => matchesTerm(haystack, term));
  const procurementPortal = portalTerms.some((term) => matchesTerm(haystack, term));
  const targetDomain = domainTerms.some((term) => matchesTerm(haystack, term));
  const excludedDomain = excludedDomains.some((domain) => item.url?.toLowerCase().includes(String(domain).toLowerCase()));
  const blacklistedIssuer = blacklistedIssuers.some((issuer) => matchesTerm(String(item.issuer ?? '').toLowerCase(), issuer));
  const deadline = item.deadline ? new Date(item.deadline) : null;
  const expired = deadline && !Number.isNaN(deadline.valueOf()) && deadline < new Date(now.toISOString().slice(0, 10));
  const published = item.published ? new Date(item.published) : null;
  const maxAge = Number(filters.max_posting_age_days);
  const stale = Number.isFinite(maxAge) && maxAge > 0 && published && !Number.isNaN(published.valueOf())
    && published < new Date(now.valueOf() - maxAge * 86400000);
  const rejectionReasons = [
    excluded && 'excluded_term',
    informational && 'informational_content',
    excludedDomain && 'excluded_domain',
    blacklistedIssuer && 'blacklisted_issuer',
    expired && 'expired_deadline',
    stale && 'stale_posting',
  ].filter(Boolean);
  if (rejectionReasons.length) return { classification: 'reject', confidence: 100, reason_codes: rejectionReasons };
  if (procurementPortal) return { classification: 'source_lead', confidence: 85, reason_codes: ['generic_procurement_source'] };
  if (!opportunityLike) return { classification: 'reject', confidence: 90, reason_codes: ['missing_solicitation_signal'] };
  if (!targetDomain) {
    return included
      ? { classification: 'source_lead', confidence: 60, reason_codes: ['service_fit_unconfirmed'] }
      : { classification: 'reject', confidence: 90, reason_codes: ['missing_service_fit'] };
  }
  return { classification: 'opportunity', confidence: 95, reason_codes: ['solicitation_signal', 'service_fit'] };
}

export function classifyItem(item, filters = {}, now = new Date()) {
  return classifyItemDetailed(item, filters, now).classification;
}

export function parseIssuerBlacklist(markdown = '') {
  return markdown.split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+(?:\[[ xX]\]\s*)?(.+?)\s*$/)?.[1]?.trim())
    .filter(Boolean);
}

export function keywordMatch(item, filters = {}) {
  return classifyItem(item, filters) !== 'reject';
}

const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'source']);

export function canonicalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.href;
  } catch {
    return String(value ?? '').trim();
  }
}

function fingerprintPart(value = '') {
  return repairText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function opportunityFingerprint(item = {}) {
  const issuer = fingerprintPart(item.issuer);
  const title = fingerprintPart(item.title);
  if (!issuer || !title) return null;
  const deadline = fingerprintPart(item.deadline ?? '');
  return `${issuer}|${title}|${deadline}`;
}

export function existingUrls(markdown) {
  return new Set((markdown.match(/https?:\/\/[^\s)>]+/g) ?? []).map(canonicalizeUrl));
}

export function existingFingerprints(markdown) {
  const fingerprints = new Set();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s*- \[[ xX]\]\s+(https?:\/\/\S+)\s+\|\s+([^|]+)\s+\|\s+([^|]+)/);
    if (!match) continue;
    const due = line.match(/\|\s+due\s+([^|]+)/i)?.[1]?.trim() ?? null;
    const fingerprint = opportunityFingerprint({ issuer: match[2].trim(), title: match[3].trim(), deadline: due });
    if (fingerprint) fingerprints.add(fingerprint);
  }
  return fingerprints;
}

function pipelineLines(items) {
  return items.map((item) => {
    const date = item.deadline ? ` | due ${repairText(item.deadline)}` : item.published ? ` | published ${repairText(item.published)}` : '';
    const confidence = Number.isFinite(item.confidence) ? ` | confidence: ${item.confidence}` : '';
    const reasons = item.reason_codes?.length ? ` | reasons: ${item.reason_codes.join(',')}` : '';
    return `- [ ] ${item.url} | ${repairText(item.issuer || 'Unknown issuer')} | ${repairText(item.title)}${date}${confidence}${reasons}`;
  }).join('\n');
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

export function mergeSourceFilters(globalFilters = {}, sourceFilters = {}) {
  return {
    ...globalFilters,
    ...sourceFilters,
    blacklist_issuers: [
      ...(globalFilters.blacklist_issuers ?? []),
      ...(sourceFilters.blacklist_issuers ?? []),
    ],
  };
}

function sourceErrorStatus(error) {
  const message = String(error?.message ?? error).toLowerCase();
  if (/\b(?:401|403)\b|unauthori[sz]ed|forbidden/.test(message)) return 'authorization_required';
  if (/unsupported source type|requires (?:url|endpoint)|duplicate discovery provider|invalid config/.test(message)) return 'configuration';
  return 'network';
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
  const seenFingerprints = existingFingerprints(current);
  const providers = options.providers ?? await loadProviderPlugins(options.providerRoots ?? defaultProviderRoots(dirname(dirname(pipelinePath))));
  const blacklistPath = resolve(options.blacklistPath ?? 'data/blacklist.md');
  const blacklistIssuers = options.blacklistIssuers ?? (existsSync(blacklistPath) ? parseIssuerBlacklist(readFileSync(blacklistPath, 'utf8')) : []);
  const globalFilters = { ...(config.filters ?? {}), blacklist_issuers: [...(config.filters?.blacklist_issuers ?? []), ...blacklistIssuers] };
  const found = [];
  const sourceLeads = [];
  const rejectedItems = [];
  const errors = [];
  const sourceHealth = [];
  const rejectionReasons = {};
  let scanned = 0;
  let duplicates = 0;
  for (const source of config.sources ?? []) {
    if (source.enabled === false) continue;
    try {
      const items = await fetchSource(source, config, providers);
      sourceHealth.push({ source: source.id, status: items.length ? 'reachable' : 'empty', detail: `${items.length} items` });
      const filters = mergeSourceFilters(globalFilters, source.filters ?? {});
      for (const item of items) {
        scanned += 1;
        const classification = classifyItemDetailed(item, filters, options.now ?? new Date());
        const result = { ...item, ...classification, canonical_url: canonicalizeUrl(item.url) };
        if (classification.classification === 'reject') {
          rejectedItems.push(result);
          for (const reason of classification.reason_codes) rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1;
          continue;
        }
        const fingerprint = opportunityFingerprint(result);
        if (seen.has(result.canonical_url) || (fingerprint && seenFingerprints.has(fingerprint))) { duplicates += 1; continue; }
        seen.add(result.canonical_url);
        if (fingerprint) seenFingerprints.add(fingerprint);
        if (classification.classification === 'opportunity') found.push(result);
        else sourceLeads.push(result);
      }
    } catch (error) {
      const status = sourceErrorStatus(error);
      errors.push({ source: source.id, status, error: error.message });
      sourceHealth.push({ source: source.id, status, detail: error.message });
    }
  }
  if ((found.length || sourceLeads.length) && !options.dryRun) {
    writeFileSync(pipelinePath, insertSourceLeads(insertPending(current, found), sourceLeads), 'utf8');
  }
  const stats = {
    scanned,
    actionable: found.length,
    source_leads: sourceLeads.length,
    rejected: rejectedItems.length,
    duplicates,
    errors: errors.length,
    rejection_reasons: rejectionReasons,
  };
  if (!options.dryRun) {
    const now = options.now ?? new Date();
    appendScanRun(stats, resolve(options.runsPath ?? join(dirname(pipelinePath), 'scan-runs.tsv')), now);
    appendSourceHealth(sourceHealth, resolve(options.healthPath ?? join(dirname(pipelinePath), 'source-health.tsv')), now);
  }
  const priorHealth = options.dryRun ? [] : loadSourceHealth(resolve(options.healthPath ?? join(dirname(pipelinePath), 'source-health.tsv')));
  const streaks = sourceFailureStreaks(priorHealth);
  const health = sourceHealth.map((record) => ({
    ...record,
    failure_streak: streaks.get(record.source) ?? 0,
    persistent_failure: (streaks.get(record.source) ?? 0) >= Number(config.source_health_threshold ?? 3),
  }));
  return { found, sourceLeads, rejectedItems, errors, sourceHealth: health, stats, dryRun: Boolean(options.dryRun) };
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
  const output = { new_opportunities: result.found.length, ...result };
  if (!args.includes('--include-rejected')) delete output.rejectedItems;
  console.log(JSON.stringify(output, null, 2));
  if (result.errors.length) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
