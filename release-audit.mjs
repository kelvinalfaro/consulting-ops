#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const forbiddenPaths = [
  'capability_statement.md',
  'config/company_profile.yml',
  'config/rfp_sources.yml',
  'modes/_company_profile.md',
  'modes/_custom.md',
  'data/rfp_pipeline.md',
  'data/rfp_tracker.md',
];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/i,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
];

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  } catch {
    throw new Error('Git repository not initialized; release audit requires a staging inventory');
  }
}

export function audit(files) {
  const failures = [];
  for (const path of forbiddenPaths) if (files.includes(path)) failures.push(`${path}: private user-layer path is tracked`);
  for (const path of files) {
    if (!existsSync(path)) continue;
    let content;
    try { content = readFileSync(path, 'utf8'); } catch { continue; }
    if (secretPatterns.some((pattern) => pattern.test(content))) failures.push(`${path}: possible secret pattern`);
  }
  return failures;
}

if (process.argv[1]?.endsWith('release-audit.mjs')) {
  const files = trackedFiles();
  const failures = audit(files);
  console.log(JSON.stringify({ tracked_files: files.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}
