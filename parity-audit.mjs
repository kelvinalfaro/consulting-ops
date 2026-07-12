#!/usr/bin/env node

/** Verify the documented consulting-ops capability surface and portable adapters. */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredFiles = [
  'consulting-ops.mjs', 'auto-pipeline.mjs', 'onboard.mjs', 'doctor.mjs', 'scan-rfps.mjs',
  'capture-rfp.mjs', 'extract-rfp.mjs', 'add-amendment.mjs', 'evaluate-rfp.mjs',
  'generate-proposal-draft.mjs', 'pursuit-artifact.mjs', 'export-proposal.mjs',
  'submission-prep.mjs', 'rfp-tracker.mjs', 'deadline-watch.mjs', 'followup.mjs',
  'client-research.mjs', 'debrief.mjs', 'analyze-outcomes.mjs', 'build-dashboard.mjs',
  'dashboard-server.mjs', 'update-system.mjs', 'release-audit.mjs', 'ARCHITECTURE.md',
  'DATA_CONTRACT.md', 'PARITY.md', 'README.md', 'AGENTS.md', 'templates/states.yml', 'providers/_registry.mjs',
  'operational-tools.mjs', 'plugin-manager.mjs',
  'CHANGELOG.md', 'CODE_OF_CONDUCT.md', 'GOVERNANCE.md', 'MAINTAINERS.md', 'SUPPORT.md',
  'LEGAL_DISCLAIMER.md', 'CONTRIBUTORS.md', 'CITATION.cff', 'DOCKER.md', 'Dockerfile', 'docker-compose.yml',
];

const adapters = ['.agents', '.claude', '.antigravitycli', '.opencode', '.qwen', '.grok', '.kimi'];
const commands = ['doctor', 'onboard', 'auto', 'capture', 'extract', 'amend', 'evaluate', 'proposal',
  'export', 'tracker', 'compare', 'search-terms', 'scan', 'pipeline', 'batch', 'deadlines',
  'followup', 'patterns', 'research', 'debrief', 'submission', 'dashboard', 'serve', 'update', 'plugins',
  'verify', 'normalize', 'dedup', 'stats', 'find', 'add', 'status', 'reconcile', 'liveness', 'inbox', 'quality'];
const modes = ['contact', 'email', 'contract', 'finalist', 'evidence'];

export function auditParity(root = '.') {
  const failures = [];
  for (const path of requiredFiles) if (!existsSync(resolve(root, path))) failures.push(`missing file: ${path}`);
  for (const adapter of adapters) {
    const path = `${adapter}/skills/consulting-ops/SKILL.md`;
    if (!existsSync(resolve(root, path))) failures.push(`missing adapter: ${path}`);
  }
  const cli = readFileSync(resolve(root, 'consulting-ops.mjs'), 'utf8');
  for (const command of commands) if (!cli.includes(`${command}:`) && !cli.includes(`'${command}':`) && !cli.includes(`'${command}'`)) failures.push(`missing CLI command: ${command}`);
  for (const mode of modes) if (!cli.includes(`'${mode}'`)) failures.push(`missing artifact mode: ${mode}`);
  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  if (packageJson.bin?.['consulting-ops'] !== './consulting-ops.mjs') failures.push('package bin is not consulting-ops.mjs');
  if (readFileSync(resolve(root, 'VERSION'), 'utf8').trim() !== packageJson.version) failures.push('VERSION and package.json disagree');
  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = auditParity();
  console.log(JSON.stringify({ status: failures.length ? 'failed' : 'passed', failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}
