import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inspectPlugin, installPlugin, listPlugins } from '../../plugin-manager.mjs';

test('audits and installs a provider plugin without executing it', () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-plugin-'));
  const source = join(root, 'source');
  mkdirSync(source);
  writeFileSync(join(source, 'manifest.yml'), 'id: fixture\nname: Fixture provider\nversion: 1.0.0\n');
  writeFileSync(join(source, 'provider.mjs'), "export default { id: 'fixture', async fetch() { throw new Error('not executed'); } };\n");
  assert.equal(inspectPlugin(source).valid, true);
  const destination = join(root, 'installed');
  const result = installPlugin(source, { destination });
  assert.equal(result.id, 'fixture');
  assert.equal(existsSync(join(destination, 'fixture', 'provider.mjs')), true);
  assert.equal(listPlugins([destination]).length, 1);
});

test('rejects malformed plugins', () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-plugin-bad-'));
  writeFileSync(join(root, 'manifest.yml'), 'name: Missing ID\n');
  assert.equal(inspectPlugin(root).valid, false);
  assert.throws(() => installPlugin(root), /Plugin audit failed/);
});
