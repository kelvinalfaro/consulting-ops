import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { addInboxRequest, listInbox, parseInbox, resolveInboxRequest } from '../../agent-inbox.mjs';

test('agent inbox adds, lists, and resolves durable requests', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'consulting-inbox-')), 'agent-inbox.md');
  addInboxRequest('scan and triage new opportunities', path, new Date('2026-07-12T14:30:00Z'));
  addInboxRequest('draft a clarification email for RFP-0042', path, new Date('2026-07-12T15:00:00Z'));
  assert.equal(listInbox(path).length, 2);
  const resolved = resolveInboxRequest(1, '4 source leads; no actionable RFPs', path);
  assert.equal(resolved.item.resolved, true);
  assert.equal(listInbox(path).length, 1);
  assert.equal(listInbox(path, true).length, 2);
  assert.match(readFileSync(path, 'utf8'), /\[x\].*result: 4 source leads/);
});

test('agent inbox parser ignores unrelated markdown checklists', () => {
  assert.equal(parseInbox('- [ ] ordinary checklist\n- [ ] 2026-07-12 09:00 — valid request').length, 1);
});
