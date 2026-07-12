#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import yaml from 'js-yaml';
import { evaluateOpportunity, renderEvaluationMarkdown } from './lib/rfp-evaluation.mjs';

function readStructured(path) {
  const text = readFileSync(path, 'utf8');
  return extname(path).toLowerCase() === '.json' ? JSON.parse(text) : yaml.load(text);
}

function slug(value) {
  return String(value ?? 'opportunity').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

const [input, ...args] = process.argv.slice(2);
if (!input || args.includes('--help') || input === '--help') {
  console.log('Usage: node evaluate-rfp.mjs <opportunity.yml|json> [--out reports/file.md]');
  process.exit(input ? 0 : 1);
}

const inputPath = resolve(input);
if (!existsSync(inputPath)) throw new Error(`Opportunity file not found: ${inputPath}`);
const outIndex = args.indexOf('--out');
const opportunity = readStructured(inputPath);
const profilePath = resolve('config/company_profile.yml');
const profile = existsSync(profilePath) ? readStructured(profilePath) : {};
const result = evaluateOpportunity(opportunity, profile);
const outputPath = resolve(outIndex >= 0 && args[outIndex + 1]
  ? args[outIndex + 1]
  : `reports/${slug(opportunity.id ?? basename(input, extname(input)))}-evaluation.md`);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, renderEvaluationMarkdown(result), 'utf8');
console.log(JSON.stringify({ output: outputPath, ...result }, null, 2));
if (result.recommendation === 'No Bid') process.exitCode = 2;
