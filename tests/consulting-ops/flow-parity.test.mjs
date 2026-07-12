import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRoute } from '../../consulting-ops.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const contract = JSON.parse(readFileSync(resolve(root, 'FLOW_PARITY.json'), 'utf8'));

test('every career flow resolves through the actual CLI router to its contracted implementation', () => {
  for (const flow of contract.flows) {
    const route = resolveRoute(flow.command, ['fixture']);
    assert.equal(route.script, flow.implementation, `${flow.career} routed to ${route.script}`);
    if (flow.implementation === 'pursuit-artifact.mjs' || flow.implementation === 'growth-assessment.mjs') {
      assert.equal(route.args[0], flow.command, `${flow.career} lost its submode argument`);
    }
  }
});

test('unknown non-command input still routes to the auto-pipeline', () => {
  assert.deepEqual(resolveRoute('https://example.test/rfp', []), { script: 'auto-pipeline.mjs', args: ['https://example.test/rfp'] });
});
