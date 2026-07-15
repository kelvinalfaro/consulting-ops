#!/usr/bin/env node

/** Verify the documented consulting-ops capability surface and portable adapters. */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredFiles = [
  'consulting-ops.mjs', 'auto-pipeline.mjs', 'onboard.mjs', 'doctor.mjs', 'scan-rfps.mjs',
  'capture-rfp.mjs', 'extract-rfp.mjs', 'add-amendment.mjs', 'evaluate-rfp.mjs',
  'generate-proposal-draft.mjs', 'pursuit-artifact.mjs', 'export-proposal.mjs',
  'submission-prep.mjs', 'rfp-tracker.mjs', 'deadline-watch.mjs', 'followup.mjs',
  'client-research.mjs', 'debrief.mjs', 'analyze-outcomes.mjs', 'build-dashboard.mjs',
  'dashboard-server.mjs', 'update-system.mjs', 'release-audit.mjs', 'ARCHITECTURE.md',
  'DATA_CONTRACT.md', 'PARITY.md', 'README.md', 'AGENTS.md', 'templates/states.yml', 'providers/_registry.mjs',
  'FLOW_PARITY.json',
  'docs/CAREER_OPS_1_19_PORT.md', 'docs/CAREER_OPS_1_20_PORT.md',
  'Consulting Ops - Ollama Qwen.cmd',
  'lib/command-center.mjs',
  'operational-tools.mjs', 'plugin-manager.mjs', 'agent-inbox.mjs', 'growth-assessment.mjs', 'submission-field-pack.mjs', 'evidence-intake.mjs', 'migrate-career-ops.mjs',
  'test-all.mjs',
  'CHANGELOG.md', 'CODE_OF_CONDUCT.md', 'GOVERNANCE.md', 'MAINTAINERS.md', 'SUPPORT.md',
  'LEGAL_DISCLAIMER.md', 'CONTRIBUTORS.md', 'CITATION.cff', 'DOCKER.md', 'Dockerfile', 'docker-compose.yml',
];

const adapters = ['.agents', '.claude', '.antigravitycli', '.opencode', '.qwen', '.grok', '.kimi'];
const commands = ['doctor', 'onboard', 'auto', 'capture', 'extract', 'amend', 'evaluate', 'proposal',
  'export', 'tracker', 'compare', 'search-terms', 'scan', 'pipeline', 'batch', 'deadlines',
  'followup', 'patterns', 'research', 'debrief', 'submission', 'apply', 'agent-inbox', 'evidence-add', 'dashboard', 'serve', 'update', 'plugins',
  'verify', 'normalize', 'dedup', 'stats', 'find', 'add', 'status', 'reconcile', 'liveness', 'inbox', 'quality', 'migrate'];
const modes = ['contact', 'email', 'contract', 'finalist', 'evidence', 'letter', 'finalist-plan', 'finalist-practice', 'finalist-debrief'];
const growthModes = ['training', 'service', 'adjacent', 'jurisdiction'];
const routedModeFiles = [
  'amend', 'auto-pipeline', 'batch', 'compare', 'contact', 'contract-review', 'deadlines',
  'debrief', 'email', 'evidence', 'export', 'finalist-prep', 'followup', 'onboarding',
  'patterns', 'pipeline', 'proposal', 'research', 'rfp', 'scan', 'search-terms',
  'submission', 'apply', 'agent-inbox', 'letter', 'finalist-plan', 'finalist-practice',
  'finalist-debrief', 'training', 'service', 'adjacent', 'jurisdiction', 'evidence-add', 'tracker',
];
export function auditParity(root = '.') {
  const failures = [];
  for (const path of requiredFiles) if (!existsSync(resolve(root, path))) failures.push(`missing file: ${path}`);
  for (const adapter of adapters) {
    const path = `${adapter}/skills/consulting-ops/SKILL.md`;
    if (!existsSync(resolve(root, path))) failures.push(`missing adapter: ${path}`);
  }
  const canonicalSkill = readFileSync(resolve(root, '.agents/skills/consulting-ops/SKILL.md'), 'utf8');
  if (!canonicalSkill.includes('run exactly `node consulting-ops.mjs`')) failures.push('canonical skill lacks deterministic command-center route');
  if (canonicalSkill.includes('npx consulting-ops')) failures.push('canonical skill uses npx instead of the source router');
  const claudePath = resolve(root, '.claude/skills/consulting-ops/SKILL.md');
  const claudeEntry = readFileSync(claudePath, 'utf8').trim();
  const claudeSkill = claudeEntry.split(/\r?\n/).length === 1 && claudeEntry.endsWith('.md')
    ? readFileSync(resolve(dirname(claudePath), claudeEntry), 'utf8')
    : claudeEntry;
  if (!claudeSkill.startsWith('---') || !claudeSkill.includes('run exactly `node consulting-ops.mjs`')) failures.push('Claude adapter does not resolve to the canonical skill');
  for (const mode of routedModeFiles) if (!existsSync(resolve(root, `modes/${mode}.md`))) failures.push(`missing routed mode instructions: modes/${mode}.md`);
  const cli = readFileSync(resolve(root, 'consulting-ops.mjs'), 'utf8');
  for (const command of commands) if (!cli.includes(`${command}:`) && !cli.includes(`'${command}':`) && !cli.includes(`'${command}'`)) failures.push(`missing CLI command: ${command}`);
  for (const mode of modes) if (!cli.includes(`'${mode}'`)) failures.push(`missing artifact mode: ${mode}`);
  for (const mode of growthModes) if (!cli.includes(`'${mode}'`)) failures.push(`missing growth mode: ${mode}`);
  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  if (packageJson.bin?.['consulting-ops'] !== './consulting-ops.mjs') failures.push('package bin is not consulting-ops.mjs');
  if (readFileSync(resolve(root, 'VERSION'), 'utf8').trim() !== packageJson.version) failures.push('VERSION and package.json disagree');
  const contract = JSON.parse(readFileSync(resolve(root, 'FLOW_PARITY.json'), 'utf8'));
  const expectedCareerFlows = ['JD/URL auto-pipeline','oferta','ofertas','contacto','deep','interview-prep','interview','regional/eu-swe','interview/plan','interview/practice','interview/debrief','pdf','latex','cover','email','training','project','tracker','agent-inbox','pipeline','apply','scan','batch','patterns','offer-prep','titles','followup','update','add'];
  const named = new Set(contract.flows?.map((flow) => flow.career));
  for (const flow of expectedCareerFlows) if (!named.has(flow)) failures.push(`unmapped career flow: ${flow}`);
  for (const flow of contract.flows ?? []) {
    for (const field of ['implementation', 'mode', 'test']) if (!existsSync(resolve(root, flow[field]))) failures.push(`${flow.career}: missing ${field} evidence ${flow[field]}`);
    if (!cli.includes(`${flow.command}:`) && !cli.includes(`'${flow.command}':`) && !cli.includes(`'${flow.command}'`)) failures.push(`${flow.career}: CLI route missing for ${flow.command}`);
  }
  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = auditParity();
  console.log(JSON.stringify({ status: failures.length ? 'failed' : 'passed', failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}
