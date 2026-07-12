#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { captureSource } from './capture-rfp.mjs';
import { extractRecord } from './extract-rfp.mjs';
import { evaluateRecord } from './evaluate-rfp.mjs';
import { createWorkspace } from './generate-proposal-draft.mjs';

function isRecord(path) {
  if (!existsSync(path) || !['.yml', '.yaml', '.json'].includes(extname(path).toLowerCase())) return false;
  try {
    const value = extname(path).toLowerCase() === '.json' ? JSON.parse(readFileSync(path, 'utf8')) : yaml.load(readFileSync(path, 'utf8'));
    return value && typeof value === 'object' && ('source_file' in value || 'source_url' in value) && 'assessment' in value;
  } catch { return false; }
}

export async function runAutoPipeline(input, options = {}) {
  let capture = null;
  let record = resolve(input);
  if (!isRecord(record)) {
    capture = await captureSource(input, { id: options.id, title: options.title, outputRoot: options.outputRoot });
    record = capture.record;
  }
  let extraction = null;
  const before = yaml.load(readFileSync(record, 'utf8'));
  if (before.source_file && options.extract !== false) extraction = await extractRecord(record);
  const evaluation = evaluateRecord(record, { trackerPath: options.trackerPath, reportsRoot: options.reportsRoot,
    profilePath: options.profilePath });
  let proposal = null;
  const pursue = ['Bid', 'Conditional Bid'].includes(evaluation.result.decision);
  if ((pursue && options.proposal !== false) || options.forceProposal) {
    const profilePath = resolve(options.profilePath ?? 'config/company_profile.yml');
    const profile = existsSync(profilePath) ? yaml.load(readFileSync(profilePath, 'utf8')) : {};
    proposal = createWorkspace(evaluation.opportunity, profile, options.proposalsRoot ?? 'proposals');
  }
  return {
    record,
    capture,
    extraction: extraction ? { source_text: extraction.source_text, warnings: extraction.opportunity.extraction?.warnings ?? [] } : null,
    evaluation: { report: evaluation.output, recommendation: evaluation.result.recommendation,
      decision: evaluation.result.decision, score: evaluation.result.scoring.score, coverage: evaluation.result.scoring.coverage },
    tracker: evaluation.tracker,
    proposal,
    next_action: proposal ? 'Complete compliance matrix before proposal narrative'
      : evaluation.result.decision === 'Needs Clarification' ? 'Resolve unknown hard gates and evidence gaps'
        : evaluation.result.decision === 'No Bid' ? 'Record rationale and monitor amendments if appropriate' : 'Review bid decision',
  };
}

async function main() {
  const args = process.argv.slice(2);
  const input = args.find((argument, index) => !argument.startsWith('--') && (index === 0 || !['--id', '--title'].includes(args[index - 1])));
  if (!input || args.includes('--help')) {
    console.log('Usage: node auto-pipeline.mjs <URL|file|opportunity.yml> [--id ID] [--title TITLE] [--force-proposal] [--no-proposal]');
    process.exit(input ? 0 : 1);
  }
  const idIndex = args.indexOf('--id');
  const titleIndex = args.indexOf('--title');
  const result = await runAutoPipeline(input, {
    id: idIndex >= 0 ? args[idIndex + 1] : undefined,
    title: titleIndex >= 0 ? args[titleIndex + 1] : undefined,
    forceProposal: args.includes('--force-proposal'),
    proposal: !args.includes('--no-proposal'),
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.evaluation.decision === 'No Bid') process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
}
