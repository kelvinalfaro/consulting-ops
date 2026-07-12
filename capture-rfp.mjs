#!/usr/bin/env node

/** Capture a URL or local file while preserving an authoritative source copy. */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'opportunity';
}

function titleFromHtml(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || null;
}

export async function captureSource(source, options = {}) {
  const id = options.id ?? `RFP-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
  const folder = resolve(options.outputRoot ?? 'data/opportunities', slug(id));
  if (existsSync(folder)) {
    if (options.reuse && existsSync(join(folder, 'opportunity.yml'))) {
      return { folder, record: join(folder, 'opportunity.yml'), source: null, reused: true };
    }
    throw new Error(`Opportunity folder already exists: ${folder}`);
  }
  mkdirSync(folder, { recursive: true });

  let sourceUrl = null;
  let sourceFile = null;
  let inferredTitle = null;
  if (/^https?:\/\//i.test(source)) {
    sourceUrl = source;
    const response = await fetch(source, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Source fetch failed: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type') ?? '';
    const extension = contentType.includes('pdf') ? '.pdf' : contentType.includes('html') ? '.html'
      : contentType.includes('wordprocessingml') ? '.docx' : '.bin';
    const bytes = Buffer.from(await response.arrayBuffer());
    sourceFile = `source${extension}`;
    writeFileSync(join(folder, sourceFile), bytes);
    if (extension === '.html') inferredTitle = titleFromHtml(bytes.toString('utf8'));
  } else {
    const local = resolve(source);
    if (!existsSync(local)) throw new Error(`Source file not found: ${local}`);
    sourceFile = `source${extname(local) || '.bin'}`;
    copyFileSync(local, join(folder, sourceFile));
    inferredTitle = basename(local, extname(local));
  }

  const opportunity = buildOpportunity({ id, sourceUrl, sourceFile, title: options.title ?? inferredTitle });
  const record = join(folder, 'opportunity.yml');
  writeFileSync(record, yaml.dump(opportunity, { noRefs: true, lineWidth: 100 }), 'utf8');
  return { folder, record, source: join(folder, sourceFile), opportunity, reused: false };
}

export function buildOpportunity({ id, sourceUrl = null, sourceFile = null, title = null }) {
  return {
    id,
    title,
    issuer: null,
    source_url: sourceUrl,
    source_file: sourceFile,
    source_type: sourceUrl ? 'web' : 'local_file',
    jurisdiction: null,
    posted_date: null,
    questions_due: null,
    intent_to_bid_due: null,
    proposal_due: null,
    anticipated_start: null,
    scope_summary: null,
    budget: { stated: false, amount: null, currency: 'USD' },
    submission: { method: null, portal: null, contact: null },
    mandatory_requirements: [],
    required_attachments: [],
    evaluation_criteria: [],
    capacity_status: 'unknown',
    terms_status: 'unknown',
    scope_status: 'unknown',
    status: 'discovered',
    assessment: { scores: {
      capability_fit: null,
      client_mission_fit: null,
      approach_differentiation: null,
      capacity_feasibility: null,
      commercial_attractiveness: null,
      procurement_win_conditions: null,
      strategic_value: null,
    } },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const source = args.find((arg) => !arg.startsWith('--'));
  if (!source || args.includes('--help')) {
    console.log('Usage: node capture-rfp.mjs <URL-or-file> [--id RFP-0001] [--title "Title"]');
    process.exit(source ? 0 : 1);
  }
  const idIndex = args.indexOf('--id');
  const titleIndex = args.indexOf('--title');
  const id = idIndex >= 0 && args[idIndex + 1] ? args[idIndex + 1] : undefined;
  const title = titleIndex >= 0 && args[titleIndex + 1] ? args[titleIndex + 1] : undefined;
  console.log(JSON.stringify(await captureSource(source, { id, title }), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
