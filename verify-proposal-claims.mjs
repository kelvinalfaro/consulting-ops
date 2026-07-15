#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.yml', '.yaml', '.json']);

export function metricClaims(text = '') {
  const patterns = [
    /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:million|billion|[kKmMbB]))?/g,
    /\b\d+(?:\.\d+)?\s?(?:%|percent\b)/gi,
    /\b\d+(?:\.\d+)?\+?\s+(?:years?|clients?|organizations?|engagements?|projects?|participants?|leaders?|staff|employees?)\b/gi,
  ];
  return [...new Set(patterns.flatMap((pattern) => text.match(pattern) ?? []).map((value) => value.toLowerCase().replace(/\s+/g, ' ').trim()))];
}

function filesUnder(path) {
  if (!existsSync(path)) return [];
  const entries = readdirSync(path, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = join(path, entry.name);
    return entry.isDirectory() ? filesUnder(full) : TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase()) ? [full] : [];
  });
}

export function verifyProposalClaims(draftText, approvedTexts = []) {
  const approved = approvedTexts.join('\n').toLowerCase().replace(/\s+/g, ' ');
  const claims = metricClaims(draftText);
  const unsupported = claims.filter((claim) => !approved.includes(claim));
  return { valid: unsupported.length === 0, claims, unsupported };
}

export function verifyWorkspace(workspace, options = {}) {
  const draftPath = resolve(workspace, 'proposal-draft.md');
  if (!existsSync(draftPath)) throw new Error(`Proposal draft not found: ${draftPath}`);
  const roots = options.evidenceRoots ?? ['capability_statement.md', 'config/company_profile.yml', 'case-studies', 'team', 'writing-samples'];
  const files = roots.flatMap((path) => {
    const absolute = resolve(path);
    if (!existsSync(absolute)) return [];
    return statSync(absolute).isDirectory() ? filesUnder(absolute) : [absolute];
  });
  const result = verifyProposalClaims(readFileSync(draftPath, 'utf8'), files.map((path) => readFileSync(path, 'utf8')));
  return { ...result, draft: draftPath, evidence_files: files.map((path) => resolve(path)) };
}

function main() {
  const workspace = process.argv[2];
  if (!workspace || process.argv.includes('--help')) {
    console.log('Usage: node verify-proposal-claims.mjs <proposal-workspace>');
    process.exit(workspace ? 0 : 1);
  }
  const result = verifyWorkspace(workspace);
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
