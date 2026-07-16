import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { extractWorkspaceArgs, markWorkspace, readConfig, resolveWorkspace, saveDefaultWorkspace } from '../../lib/workspace.mjs';
import { installSkill, skillDestinations } from '../../install-skill.mjs';

test('workspace precedence is CLI, environment, saved config, then cwd', () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-ops-workspace-'));
  try {
    const env = { CONSULTING_OPS_CONFIG: join(root, 'config.json') };
    assert.equal(resolveWorkspace({ cwd: join(root, 'cwd'), env }), resolve(root, 'cwd'));
    saveDefaultWorkspace(join(root, 'saved'), env);
    assert.equal(resolveWorkspace({ cwd: root, env }), resolve(root, 'saved'));
    assert.equal(resolveWorkspace({ cwd: root, env: { ...env, CONSULTING_OPS_WORKSPACE: join(root, 'env') } }), resolve(root, 'env'));
    assert.equal(resolveWorkspace({ cwd: root, explicit: join(root, 'cli'), env: { ...env, CONSULTING_OPS_WORKSPACE: join(root, 'env') } }), resolve(root, 'cli'));
    assert.equal(readConfig(env).default_workspace, resolve(root, 'saved'));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('workspace arguments are global and workspace markers are explicit', () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-ops-marker-'));
  try {
    const parsed = extractWorkspaceArgs(['tracker', '--workspace', root, '--json']);
    assert.equal(parsed.workspace, resolve(root)); assert.deepEqual(parsed.args, ['tracker', '--json']);
    const marker = markWorkspace(root); assert.equal(existsSync(marker), true);
    assert.equal(JSON.parse(readFileSync(marker, 'utf8')).product, 'consulting-ops');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('portable concierge can be installed for standard and native agent locations', () => {
  const home = mkdtempSync(join(tmpdir(), 'consulting-ops-skills-'));
  try {
    const expected = skillDestinations('all', home); const installed = installSkill({ agent: 'all', home });
    assert.deepEqual(installed.map((item) => item.destination).sort(), expected.map((item) => resolve(item)).sort());
    for (const path of expected) assert.match(readFileSync(join(path, 'SKILL.md'), 'utf8'), /name: consulting-concierge/);
  } finally { rmSync(home, { recursive: true, force: true }); }
});
