#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { extractOpportunityFields, extractTextFromFile, mergeExtractedFields } from './lib/extract-rfp.mjs';

export async function extractRecord(recordPath, options = {}) {
  const absolute = resolve(recordPath);
  if (!existsSync(absolute)) throw new Error(`Opportunity record not found: ${absolute}`);
  const opportunity = extname(absolute) === '.json' ? JSON.parse(readFileSync(absolute, 'utf8')) : yaml.load(readFileSync(absolute, 'utf8'));
  if (!opportunity.source_file) throw new Error('Opportunity record has no source_file');
  const sourcePath = resolve(dirname(absolute), opportunity.source_file);
  const text = await extractTextFromFile(sourcePath);
  const textPath = join(dirname(absolute), 'source.txt');
  writeFileSync(textPath, text, 'utf8');
  const maxChars = Number.isInteger(options.maxChars) && options.maxChars > 0 ? options.maxChars : 120000;
  const merged = mergeExtractedFields(opportunity, extractOpportunityFields(text.slice(0, maxChars)));
  merged.extraction = { ...merged.extraction, analyzed_characters: Math.min(text.length, maxChars), source_characters: text.length, truncated_for_analysis: text.length > maxChars };
  writeFileSync(absolute, yaml.dump(merged, { noRefs: true, lineWidth: 120 }), 'utf8');
  return { record: absolute, source_text: textPath, opportunity: merged };
}

async function main() {
  const args = process.argv.slice(2);
  const input = args.find((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--max-chars');
  const maxIndex = args.indexOf('--max-chars');
  const maxChars = maxIndex >= 0 ? Number(args[maxIndex + 1]) : undefined;
  if (!input || process.argv.includes('--help')) {
    console.log('Usage: node extract-rfp.mjs <data/opportunities/id/opportunity.yml> [--max-chars N]');
    process.exit(input ? 0 : 1);
  }
  if (maxIndex >= 0 && (!Number.isInteger(maxChars) || maxChars <= 0)) throw new Error('--max-chars must be a positive integer');
  console.log(JSON.stringify(await extractRecord(input, { maxChars }), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
