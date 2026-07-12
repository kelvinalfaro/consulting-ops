#!/usr/bin/env node

/** Durable, local-first request queue for consulting-ops sessions. */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PATH = 'data/agent-inbox.md';
const HEADER = '# Consulting-ops agent inbox\n\nQueue requests as unchecked items. Nothing in this inbox authorizes sending, signing, pricing approval, or proposal submission.\n';

function clean(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function timestamp(now = new Date()) {
  return now.toISOString().slice(0, 16).replace('T', ' ');
}

export function parseInbox(markdown = '') {
  const rows = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s*- \[([ xX])\]\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s+—\s+(.+?)\s*$/);
    if (!match) continue;
    const [request, result = ''] = match[3].split(/\s+→\s+result:\s+/i, 2);
    rows.push({ number: rows.length + 1, resolved: match[1].toLowerCase() === 'x', timestamp: match[2], request: request.trim(), result: result.trim(), line });
  }
  return rows;
}

function atomicWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
  renameSync(temp, path);
}

export function addInboxRequest(request, path = resolve(DEFAULT_PATH), now = new Date()) {
  const text = clean(request);
  if (!text) throw new Error('Request cannot be empty');
  const current = existsSync(path) ? readFileSync(path, 'utf8').trimEnd() : HEADER.trimEnd();
  const line = `- [ ] ${timestamp(now)} — ${text}`;
  atomicWrite(path, `${current}\n\n${line}\n`);
  return { path, item: parseInbox(`${current}\n${line}`).at(-1) };
}

export function listInbox(path = resolve(DEFAULT_PATH), includeResolved = false) {
  const rows = existsSync(path) ? parseInbox(readFileSync(path, 'utf8')) : [];
  return includeResolved ? rows : rows.filter((row) => !row.resolved);
}

export function resolveInboxRequest(number, result, path = resolve(DEFAULT_PATH)) {
  if (!existsSync(path)) throw new Error(`Agent inbox not found: ${path}`);
  const markdown = readFileSync(path, 'utf8');
  const rows = parseInbox(markdown);
  const target = rows.find((row) => row.number === Number(number));
  if (!target) throw new Error(`Inbox item not found: ${number}`);
  if (target.resolved) throw new Error(`Inbox item is already resolved: ${number}`);
  const suffix = clean(result);
  const replacement = target.line.replace('- [ ]', '- [x]') + (suffix ? ` → result: ${suffix}` : '');
  atomicWrite(path, markdown.replace(target.line, replacement));
  return { path, item: parseInbox(markdown.replace(target.line, replacement)).find((row) => row.number === Number(number)) };
}

function main() {
  const [command = 'list', ...args] = process.argv.slice(2);
  const pathIndex = args.indexOf('--path');
  const path = resolve(pathIndex >= 0 && args[pathIndex + 1] ? args[pathIndex + 1] : DEFAULT_PATH);
  if (command === 'add') return addInboxRequest(args.filter((arg, index) => index !== pathIndex && index !== pathIndex + 1).join(' '), path);
  if (command === 'list') return { path, items: listInbox(path, args.includes('--all')) };
  if (command === 'resolve') {
    const resultIndex = args.indexOf('--result');
    return resolveInboxRequest(args[0], resultIndex >= 0 ? args.slice(resultIndex + 1, pathIndex >= 0 ? pathIndex : undefined).join(' ') : '', path);
  }
  throw new Error('Usage: agent-inbox.mjs add <request> | list [--all] | resolve <number> [--result text] [--path file]');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(main(), null, 2)); } catch (error) { console.error(error.message); process.exit(1); }
}
