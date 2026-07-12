#!/usr/bin/env node

/** Portable RFP discovery. Supports manual, RSS/Atom, and JSON sources. */

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import yaml from 'js-yaml';

const DEFAULT_CONFIG = 'config/rfp_sources.yml';
const DEFAULT_PIPELINE = 'data/rfp_pipeline.md';

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
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

function keywordMatch(item, filters = {}) {
  const haystack = `${item.title} ${item.issuer} ${item.summary ?? ''}`.toLowerCase();
  const include = Array.isArray(filters.include_terms) ? filters.include_terms : [];
  const exclude = Array.isArray(filters.exclude_terms) ? filters.exclude_terms : [];
  return (!include.length || include.some((term) => haystack.includes(String(term).toLowerCase())))
    && !exclude.some((term) => haystack.includes(String(term).toLowerCase()));
}

export function existingUrls(markdown) {
  return new Set(markdown.match(/https?:\/\/[^\s)>]+/g) ?? []);
}

function pipelineLines(items) {
  return items.map((item) => `- [ ] ${item.url} | ${item.issuer || 'Unknown issuer'} | ${item.title}${item.published ? ` | published ${item.published}` : ''}`).join('\n');
}

async function fetchSource(source) {
  if (source.type === 'manual') return [];
  if (!source.url) throw new Error(`Source ${source.id} requires url`);
  const response = await fetch(source.url, {
    headers: { 'user-agent': 'consulting-ops/0.1 (+local RFP discovery)' },
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
  const found = [];
  const errors = [];
  for (const source of config.sources ?? []) {
    if (source.enabled === false) continue;
    try {
      const items = await fetchSource(source);
      for (const item of items) {
        if (!seen.has(item.url) && keywordMatch(item, config.filters)) {
          seen.add(item.url);
          found.push(item);
        }
      }
    } catch (error) {
      errors.push({ source: source.id, error: error.message });
    }
  }
  if (found.length && !options.dryRun) appendFileSync(pipelinePath, `\n${pipelineLines(found)}\n`, 'utf8');
  return { found, errors, dryRun: Boolean(options.dryRun) };
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
