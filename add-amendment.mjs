#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { extractOpportunityFields, extractTextFromFile } from './lib/extract-rfp.mjs';

async function saveSource(source, folder, number) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Amendment fetch failed: ${response.status} ${response.statusText}`);
    const type = response.headers.get('content-type') ?? '';
    const extension = type.includes('pdf') ? '.pdf' : type.includes('html') ? '.html'
      : type.includes('wordprocessingml') ? '.docx' : '.bin';
    const path = join(folder, `amendment-${number}${extension}`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
    return { path, url: source };
  }
  const local = resolve(source);
  if (!existsSync(local)) throw new Error(`Amendment file not found: ${local}`);
  const path = join(folder, `amendment-${number}${extname(local) || '.bin'}`);
  copyFileSync(local, path);
  return { path, url: null };
}

export async function addAmendment(recordPath, source, options = {}) {
  const absolute = resolve(recordPath);
  const opportunity = yaml.load(readFileSync(absolute, 'utf8'));
  const folder = join(dirname(absolute), 'amendments');
  mkdirSync(folder, { recursive: true });
  const number = (opportunity.amendments?.length ?? 0) + 1;
  const saved = await saveSource(source, folder, number);
  const text = await extractTextFromFile(saved.path);
  const textFile = join(folder, `amendment-${number}.txt`);
  writeFileSync(textFile, text, 'utf8');
  const extracted = extractOpportunityFields(text);
  const changes = {};
  for (const field of ['title', 'issuer', 'questions_due', 'intent_to_bid_due', 'proposal_due', 'anticipated_start', 'scope_summary']) {
    if (extracted[field] != null && extracted[field] !== opportunity[field]) changes[field] = { current: opportunity[field] ?? null, amendment_candidate: extracted[field] };
  }
  if (extracted.budget?.stated && JSON.stringify(extracted.budget) !== JSON.stringify(opportunity.budget)) {
    changes.budget = { current: opportunity.budget ?? null, amendment_candidate: extracted.budget };
  }
  opportunity.amendments = [...(opportunity.amendments ?? []), {
    number,
    captured_at: new Date().toISOString(),
    source_url: saved.url,
    source_file: `amendments/${basename(saved.path)}`,
    text_file: `amendments/${basename(textFile)}`,
    sha256: createHash('sha256').update(readFileSync(saved.path)).digest('hex'),
    review_status: 'pending',
    candidate_changes: changes,
  }];
  opportunity.amendment_review_required = true;
  writeFileSync(absolute, yaml.dump(opportunity, { noRefs: true, lineWidth: 120 }), 'utf8');
  return { record: absolute, amendment: opportunity.amendments.at(-1), candidate_changes: changes };
}

async function main() {
  const [record, source] = process.argv.slice(2);
  if (!record || !source || process.argv.includes('--help')) {
    console.log('Usage: node add-amendment.mjs <opportunity.yml> <URL-or-file>');
    process.exit(record && source ? 0 : 1);
  }
  console.log(JSON.stringify(await addAmendment(record, source), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
