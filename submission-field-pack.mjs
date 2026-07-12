#!/usr/bin/env node

/** Prepare a human-reviewed portal field/attachment worksheet. Never drives a browser or submits. */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function tableRows(markdown) {
  return markdown.split(/\r?\n/).filter((line) => /^\|/.test(line) && !/^\|[- :|]+\|?$/.test(line))
    .map((line) => line.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()))
    .filter((cells, index) => index > 0 && cells.some(Boolean));
}

export function buildSubmissionFieldPack(workspace, options = {}) {
  const root = resolve(workspace);
  const matrixPath = resolve(root, 'compliance-matrix.md');
  const draftPath = resolve(root, 'proposal-draft.md');
  if (!existsSync(matrixPath) || !existsSync(draftPath)) throw new Error('Proposal workspace must contain compliance-matrix.md and proposal-draft.md');
  const matrix = readFileSync(matrixPath, 'utf8');
  const rows = tableRows(matrix);
  const path = resolve(options.output ?? resolve(root, 'submission-field-pack.md'));
  const text = `# Submission field pack\n\n> Preparation only. This file does not authorize browser entry, sending, signing, certification, pricing approval, or submission.\n\n**Workspace:** ${basename(root)}\n**Compliance source:** compliance-matrix.md\n**Narrative source:** proposal-draft.md\n\n## Portal and submission facts\n\n- Portal or delivery channel: [Verify from solicitation]\n- Account owner: [Human]\n- Submission deadline and time zone: [Verify]\n- Required naming convention: [Verify]\n- Final submitter: [Authorized human]\n\n## Fields and requirements\n\n| # | Requirement / portal field | Draft response or file | Approved evidence | Character/file limit | Human owner | Verified |\n|---|---|---|---|---|---|---|\n${rows.length ? rows.map((row, index) => `| ${index + 1} | ${row[1] ?? row[0] ?? '[Review]'} | [Map from draft or attachment] | [Source] | [Confirm] | | [ ] |`).join('\n') : '| 1 | [Transcribe from portal or solicitation] | | | | | [ ] |'}\n\n## Certifications and representations\n\n| Item | Exact text/source | Authorized reviewer | Decision | Complete |\n|---|---|---|---|---|\n| [Add every certification, representation, signature, and attestation] | | | Pending | [ ] |\n\n## Attachments\n\n| Required file | Local final file | Format/size limit | Filename verified | Final reviewer | Complete |\n|---|---|---|---|---|---|\n| [Map from compliance matrix] | | | [ ] | | [ ] |\n\n## Stop-before-submit control\n\nThe system may help transcribe or review fields only in an explicitly supervised session. It must stop before any final Submit, Send, Certify, Sign, or equivalent action.\n`;
  writeFileSync(path, text, 'utf8');
  return { workspace: root, path, requirements_mapped: rows.length, submission_performed: false };
}

function main() {
  const args = process.argv.slice(2);
  const workspace = args.find((arg) => !arg.startsWith('--'));
  if (!workspace || args.includes('--help')) {
    console.log('Usage: submission-field-pack.mjs <proposal-workspace> [--out file.md]');
    process.exit(workspace ? 0 : 1);
  }
  const outIndex = args.indexOf('--out');
  console.log(JSON.stringify(buildSubmissionFieldPack(workspace, { output: outIndex >= 0 ? args[outIndex + 1] : undefined }), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
