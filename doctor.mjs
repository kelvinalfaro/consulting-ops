#!/usr/bin/env node

/** Setup validation for consulting-ops. Safe to run offline. */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = (() => {
  const args = process.argv.slice(2);
  const index = args.indexOf('--target');
  return index >= 0 && args[index + 1]
    ? args[index + 1]
    : dirname(fileURLToPath(import.meta.url));
})();

const jsonOutput = process.argv.includes('--json');

export const USER_LAYER_PREREQS = [
  {
    path: 'capability_statement.md',
    template: 'capability_statement.example.md',
    description: 'approved firm capabilities and past performance',
  },
  {
    path: 'config/company_profile.yml',
    template: 'config/company_profile.example.yml',
    description: 'firm identity, targeting, capacity, and commercial preferences',
  },
  {
    path: 'modes/_company_profile.md',
    template: 'modes/_company_profile.template.md',
    description: 'firm-specific positioning and evaluation overrides',
  },
];

export const RECOMMENDED_FILES = [
  {
    path: 'config/rfp_sources.yml',
    template: 'config/rfp_sources.example.yml',
    description: 'RFP discovery sources and search terms',
  },
];

const DIRECTORIES = [
  'case-studies',
  'team',
  'data/opportunities',
  'proposals',
  'reports',
  'writing-samples',
];

const PIPELINE = `# RFP pipeline

Add an opportunity as \`- [ ] <URL-or-local-file>\`. Preserve the authoritative source.

## Pending

## Processed
`;

const TRACKER = `# RFP tracker

| # | Identified | Issuer | Opportunity | Score | Due | Value | Status | Report | Notes |
|---|---|---|---|---|---|---|---|---|---|
`;

function fileExists(relativePath) {
  return existsSync(join(root, ...relativePath.split('/')));
}

function safeCreate(relativePath, content) {
  const target = join(root, ...relativePath.split('/'));
  if (existsSync(target)) return false;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
  return true;
}

function parseYamlEnough(relativePath) {
  try {
    const value = readFileSync(join(root, ...relativePath.split('/')), 'utf8');
    return value.trim().length > 0 && /(^|\n)[A-Za-z_][\w-]*\s*:/m.test(value);
  } catch {
    return false;
  }
}

function state({ initialize = false } = {}) {
  const created = [];
  if (initialize) {
    for (const directory of DIRECTORIES) {
      const path = join(root, ...directory.split('/'));
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
        created.push(`${directory}/`);
      }
    }
    if (safeCreate('data/rfp_pipeline.md', PIPELINE)) created.push('data/rfp_pipeline.md');
    if (safeCreate('data/rfp_tracker.md', TRACKER)) created.push('data/rfp_tracker.md');
  }

  const missing = USER_LAYER_PREREQS
    .filter(({ path }) => !fileExists(path))
    .map(({ path, template, description }) => ({ path, template, description }));
  const recommendedMissing = RECOMMENDED_FILES
    .filter(({ path }) => !fileExists(path))
    .map(({ path, template, description }) => ({ path, template, description }));
  const warnings = [];

  if (fileExists('config/company_profile.yml') && !parseYamlEnough('config/company_profile.yml')) {
    warnings.push('config/company_profile.yml is empty or does not appear to contain YAML fields');
  }
  if (fileExists('capability_statement.md')) {
    const text = readFileSync(join(root, 'capability_statement.md'), 'utf8');
    if (text.trim().length < 200) warnings.push('capability_statement.md appears incomplete');
  }

  return {
    product: 'consulting-ops',
    onboardingNeeded: missing.length > 0,
    missing,
    recommendedMissing,
    warnings,
    created,
  };
}

export function initializeWorkspace(targetRoot = root) {
  if (targetRoot !== root) throw new Error('Use --target before importing doctor.mjs');
  return state({ initialize: true });
}

function printHuman(result) {
  console.log('\nconsulting-ops doctor');
  console.log('=====================\n');
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  console.log(`${nodeMajor >= 18 ? 'OK' : 'FAIL'} Node.js >= 18 (v${process.versions.node})`);
  console.log(`${existsSync(join(root, 'node_modules')) ? 'OK' : 'FAIL'} Dependencies installed`);
  for (const prerequisite of USER_LAYER_PREREQS) {
    console.log(`${fileExists(prerequisite.path) ? 'OK' : 'MISSING'} ${prerequisite.path}`);
  }
  for (const item of result.recommendedMissing) {
    console.log(`RECOMMENDED ${item.path} (copy from ${item.template})`);
  }
  for (const warning of result.warnings) console.log(`WARNING ${warning}`);
  for (const item of result.created) console.log(`CREATED ${item}`);
  if (nodeMajor < 18 || !existsSync(join(root, 'node_modules')) || result.onboardingNeeded) {
    console.log('\nSetup is incomplete. Copy the listed example/template files and replace placeholders with approved firm information.');
    process.exitCode = 1;
  } else {
    console.log('\nCore setup is ready. Run `npm run scan` or capture an opportunity for evaluation.');
  }
}

const result = state({ initialize: !jsonOutput });
if (jsonOutput) console.log(JSON.stringify(result));
else printHuman(result);
