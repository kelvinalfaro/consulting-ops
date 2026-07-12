import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const mode = (name) => readFileSync(resolve(root, 'modes', `${name}.md`), 'utf8').replace(/\s+/g, ' ');

test('letter mode pins source, research, user-choice, claim, approval, and no-send gates', () => {
  const text = mode('letter');
  for (const phrase of ['authoritative solicitation', 'approved sources', 'ask for', 'Every material claim', 'user approves', 'Never send']) assert.match(text, new RegExp(phrase, 'i'));
});

test('apply mode pins completeness, field mapping, human ownership, and final stop gates', () => {
  const text = mode('apply');
  for (const phrase of ['hard stops', 'character/file limit', 'Never infer', 'pricing, legal terms', 'stop before every final Submit']) assert.match(text, new RegExp(phrase, 'i'));
});

test('adjacent mode pins evidence categories and separately confirmed configuration writes', () => {
  const text = mode('adjacent');
  for (const phrase of ['Close adjacency', 'Stretch adjacency', 'Experimental pivot', 'exact YAML diff', 'explicit user confirmation', 'separate diff and separate confirmation']) assert.match(text, new RegExp(phrase, 'i'));
});

test('finalist practice is one-question-at-a-time and feedback-driven', () => {
  const text = mode('finalist-practice');
  for (const phrase of ['one question at a time', 'wait for the complete answer', 'Give concise feedback', 'approved evidence', 'prioritized rehearsal actions']) assert.match(text, new RegExp(phrase, 'i'));
});
