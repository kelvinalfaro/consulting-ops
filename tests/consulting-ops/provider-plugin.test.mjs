import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadProviderPlugins } from '../../providers/_registry.mjs';
import { scan } from '../../scan-rfps.mjs';

test('loads a local provider plugin and uses it during discovery', async () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-provider-'));
  const plugins = join(root, 'plugins.local');
  mkdirSync(join(plugins, 'fixture'), { recursive: true });
  writeFileSync(join(plugins, 'fixture', 'provider.mjs'), `export default { id: 'fixture', async fetch(source) { return [{ title: source.title, url: source.url, issuer: 'Fixture Agency', source_id: source.id }]; } };`);
  const providers = await loadProviderPlugins([plugins]);
  assert.ok(providers.has('fixture'));
  const pipelinePath = join(root, 'pipeline.md');
  const result = await scan({ sources: [{ id: 'fixture-source', type: 'fixture', title: 'Leadership RFP', url: 'https://example.test/rfp' }] }, { pipelinePath, providers });
  assert.equal(result.found.length, 1);
  assert.equal(result.stats.actionable, 1);
  assert.match(readFileSync(pipelinePath, 'utf8'), /Leadership RFP/);
});
