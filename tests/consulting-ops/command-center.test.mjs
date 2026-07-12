import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fullHelp } from '../../consulting-ops.mjs';
import { getCommandCenterStatus, PRIMARY_COMMANDS, renderCommandCenter } from '../../lib/command-center.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const contract = JSON.parse(readFileSync(resolve(root, 'FLOW_PARITY.json'), 'utf8'));

function response(value, status = 0) {
  return { status, stdout: typeof value === 'string' ? value : JSON.stringify(value), stderr: '', error: null };
}

function runner({ doctor = { onboardingNeeded: false, missing: [], warnings: [] }, update = { status: 'up-to-date', local: '0.2.0', remote: '0.1.0' }, doctorStatus = 0, updateStatus = 0 } = {}) {
  return (script) => script === 'doctor.mjs' ? response(doctor, doctorStatus) : response(update, updateStatus);
}

test('ready command center is concise and does not describe an older remote as an update', () => {
  const status = getCommandCenterStatus({ run: runner(), localVersion: '0.2.0' });
  const text = renderCommandCenter(status);
  assert.equal(status.ready, true);
  assert.equal(status.primary_commands.length, 18);
  assert.match(text, /no newer release is available \(local v0\.2\.0\)/);
  assert.doesNotMatch(text, /published release 0\.1\.0/);
  assert.match(text, /node consulting-ops\.mjs more/);
});

test('command center stops at onboarding guidance when prerequisites are missing', () => {
  const status = getCommandCenterStatus({ run: runner({ doctor: { onboardingNeeded: true, missing: ['capability_statement.md'], warnings: [] } }) });
  const text = renderCommandCenter(status);
  assert.equal(status.ready, false);
  assert.match(text, /Setup required/);
  assert.match(text, /node consulting-ops\.mjs onboard/);
  assert.doesNotMatch(text, /- scan/);
});

test('command center reports a newer release and tolerates unavailable or malformed update output', () => {
  const available = getCommandCenterStatus({ run: runner({ update: { status: 'update-available', local: '0.2.0', remote: '0.3.0' } }) });
  assert.match(renderCommandCenter(available), /Update available: v0\.3\.0/);
  const offline = getCommandCenterStatus({ run: runner({ update: '{broken', updateStatus: 0 }), localVersion: '0.2.0' });
  assert.equal(offline.update.status, 'unavailable');
  assert.match(renderCommandCenter(offline), /no newer release is available/);
});

test('doctor failure and malformed doctor output fail clearly', () => {
  assert.throws(() => getCommandCenterStatus({ run: runner({ doctor: 'failed', doctorStatus: 1 }) }), /Setup check failed/);
  assert.throws(() => getCommandCenterStatus({ run: runner({ doctor: '{broken' }) }), /Setup check returned invalid JSON/);
});

test('full help retains every contracted command while the primary menu stays bounded', () => {
  const help = fullHelp();
  for (const flow of contract.flows) assert.match(help, new RegExp(`consulting-ops ${flow.command}\\b`), `missing ${flow.command}`);
  assert.equal(PRIMARY_COMMANDS.length, 18);
  const result = spawnSync(process.execPath, ['consulting-ops.mjs', 'more'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Full Command Reference/);
});

test('skills pin the direct router and forbid separate startup checks', () => {
  for (const relative of ['.agents/skills/consulting-ops/SKILL.md', '.claude/skills/consulting-ops/SKILL.md']) {
    const skill = readFileSync(resolve(root, relative), 'utf8');
    assert.match(skill, /run exactly `node consulting-ops\.mjs`/);
    assert.match(skill, /without running doctor or update separately/);
    assert.doesNotMatch(skill, /npx consulting-ops/);
  }
});

test('source-checkout documentation contains no npx consulting-ops routes', () => {
  const files = ['README.md', 'AGENTS.md', 'CODEX.md', ...readFileSync(resolve(root, 'package.json'), 'utf8').match(/modes\/[^"]+\.md/g) ?? []];
  for (const file of new Set(files)) {
    const text = readFileSync(resolve(root, file), 'utf8');
    assert.doesNotMatch(text, /npx consulting-ops/, file);
  }
});

test('direct tracker route preserves command output and exit status', () => {
  const result = spawnSync(process.execPath, ['consulting-ops.mjs', 'tracker'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.ok(Array.isArray(payload.rows));
  assert.equal(typeof payload.metrics.total, 'number');
});
