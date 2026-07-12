import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditParity } from '../../parity-audit.mjs';

test('required CLI, docs, lifecycle tools, and AI adapters are present', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  assert.deepEqual(auditParity(root), []);
});
