#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { evaluateOpportunity, renderEvaluationMarkdown } from './lib/rfp-evaluation.mjs';
import { upsertOpportunity } from './lib/tracker-store.mjs';

export function readStructured(path) {
  const text = readFileSync(path, 'utf8');
  return extname(path).toLowerCase() === '.json' ? JSON.parse(text) : yaml.load(text);
}

function slug(value) {
  return String(value ?? 'opportunity').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export function evaluateRecord(input, options = {}) {
  const inputPath = resolve(input);
  if (!existsSync(inputPath)) throw new Error(`Opportunity file not found: ${inputPath}`);
  const opportunity = readStructured(inputPath);
  const profilePath = resolve(options.profilePath ?? 'config/company_profile.yml');
  const profile = existsSync(profilePath) ? readStructured(profilePath) : {};
  const result = evaluateOpportunity(opportunity, profile, options);
  const outputPath = resolve(options.outputPath
    ?? `${options.reportsRoot ?? 'reports'}/${slug(opportunity.id ?? basename(input, extname(input)))}-evaluation.md`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderEvaluationMarkdown(result), 'utf8');
  opportunity.assessment = { ...opportunity.assessment, score: result.scoring.score, coverage: result.scoring.coverage,
    recommendation: result.recommendation, decision: result.decision, evaluated_at: result.evaluated_at };
  if (options.updateRecord !== false) writeFileSync(inputPath, yaml.dump(opportunity, { noRefs: true, lineWidth: 120 }), 'utf8');
  let tracker = null;
  if (options.track !== false) {
    const status = result.decision === 'Bid' || result.decision === 'Conditional Bid' ? 'Bid'
      : result.decision === 'No Bid' ? 'No Bid' : 'Evaluated';
    tracker = upsertOpportunity(opportunity, {
      status,
      score: result.scoring.score == null ? '' : `${result.scoring.score}/5`,
      report: relative(resolve('data'), outputPath).replace(/\\/g, '/'),
      notes: result.recommendation,
    }, options.trackerPath);
  }
  return { output: outputPath, opportunity, result, tracker };
}

function main() {
  const [input, ...args] = process.argv.slice(2);
  if (!input || args.includes('--help') || input === '--help') {
    console.log('Usage: node evaluate-rfp.mjs <opportunity.yml|json> [--out reports/file.md] [--no-track]');
    process.exit(input ? 0 : 1);
  }
  const outIndex = args.indexOf('--out');
  const value = evaluateRecord(input, {
    outputPath: outIndex >= 0 && args[outIndex + 1] ? args[outIndex + 1] : undefined,
    track: !args.includes('--no-track'),
  });
  console.log(JSON.stringify({ output: value.output, ...value.result, tracker: value.tracker }, null, 2));
  if (value.result.recommendation === 'No Bid') process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
