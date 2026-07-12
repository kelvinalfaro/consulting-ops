import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const primaryFlows = [
  'scan', 'pipeline', 'evaluate', 'proposal', 'compare', 'research', 'contact', 'email',
  'evidence', 'evidence-add', 'letter', 'amend', 'apply', 'submission', 'export', 'finalist', 'finalist-plan',
  'finalist-practice', 'finalist-debrief', 'contract', 'tracker', 'inbox', 'agent-inbox',
  'deadlines', 'followup', 'debrief', 'patterns', 'training', 'service', 'adjacent', 'jurisdiction', 'dashboard', 'doctor', 'update',
];

test('no-argument CLI exposes the complete consulting command center', () => {
  const result = spawnSync(process.execPath, ['consulting-ops.mjs', 'help'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /consulting-ops -- Command Center/);
  for (const flow of primaryFlows) assert.match(result.stdout, new RegExp(`consulting-ops ${flow}\\b`), `missing ${flow}`);
  assert.match(result.stdout, /never submits a proposal/i);
});

test('skill startup contract includes readiness checks and the same primary flows', () => {
  const skill = readFileSync(resolve(root, '.agents/skills/consulting-ops/SKILL.md'), 'utf8');
  assert.match(skill, /node doctor\.mjs --json/);
  assert.match(skill, /node update-system\.mjs check/);
  for (const flow of primaryFlows) assert.match(skill, new RegExp(`- ${flow} `), `missing ${flow}`);
});
