import test from 'node:test';
import assert from 'node:assert/strict';
import { audit } from '../../release-audit.mjs';

test('release audit rejects tracked private user-layer files', () => {
  assert.ok(audit(['capability_statement.md']).some((failure) => failure.includes('private user-layer')));
});

test('release audit accepts neutral example path', () => {
  assert.deepEqual(audit(['capability_statement.example.md']), []);
});
