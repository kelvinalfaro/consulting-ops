#!/usr/bin/env node

/** Review-first migration helper for a partial career-ops working copy. */

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function files(root, subdir) {
  const path = join(root, subdir);
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return [subdir];
  return readdirSync(path, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => join(subdir, entry.name).replace(/\\/g, '/'));
}

export function inspectCareerMigration(sourceRoot, options = {}) {
  const source = resolve(sourceRoot);
  if (!existsSync(source)) throw new Error(`Career-ops source not found: ${source}`);
  const checks = [
    ['cv.md', 'Stage relevant firm/team experience through evidence-add; do not convert candidate claims automatically.'],
    ['config/profile.yml', 'Map identity, location, services, constraints, and goals into company_profile.yml through human review.'],
    ['modes/_profile.md', 'Review for durable positioning rules; do not copy career archetypes or compensation logic.'],
    ['modes/_custom.md', 'Review procedural preferences and selectively carry forward consulting-relevant rules.'],
    ['article-digest.md', 'Stage supported proof points through evidence-add with authorship and confidentiality checks.'],
    ['data/applications.md', 'Do not import into the RFP tracker; retain only relationship/outcome learnings after review.'],
    ['data/pipeline.md', 'Do not import job URLs into the RFP pipeline.'],
    ['writing-samples', 'Review samples individually for ownership, confidentiality, and consulting relevance.'],
  ];
  const inventory = checks.map(([path, action]) => ({ path, found: files(source, path), action })).filter((item) => item.found.length);
  const output = resolve(options.output ?? 'reports/career-ops-migration-review.md');
  mkdirSync(resolve(output, '..'), { recursive: true });
  const text = `# Career-ops to consulting-ops migration review\n\n**Source:** ${source}\n**Mode:** Review only — no user-layer files were copied or overwritten.\n\n## Inventory and disposition\n\n| Career source | Files found | Consulting disposition | Approved |\n|---|---:|---|---|\n${inventory.map((item) => `| ${item.path} | ${item.found.length} | ${item.action} | [ ] |`).join('\n') || '| None recognized | 0 | Confirm the source is a career-ops workspace. | [ ] |'}\n\n## Required decisions\n\n- [ ] Confirm the authoritative consulting firm identity and profile.\n- [ ] Review every candidate proof point for firm relevance, authorship, client permission, and confidentiality.\n- [ ] Show exact diffs before writing company_profile.yml, capability_statement.md, case-studies/, team/, writing-samples/, or custom modes.\n- [ ] Keep career applications, job URLs, salary data, and interview records out of the RFP tracker.\n\nNo migration action is automatic. Use onboarding and evidence-add after the user approves each disposition.\n`;
  writeFileSync(output, text, 'utf8');
  return { source, output, recognized_groups: inventory.length, files_found: inventory.reduce((sum, item) => sum + item.found.length, 0), files_copied: 0 };
}

function main() {
  const args = process.argv.slice(2);
  const source = args.find((arg) => !arg.startsWith('--'));
  if (!source || args.includes('--help')) {
    console.log('Usage: migrate-career-ops.mjs <career-ops-folder> [--out review.md]');
    process.exit(source ? 0 : 1);
  }
  const outIndex = args.indexOf('--out');
  console.log(JSON.stringify(inspectCareerMigration(source, { output: outIndex >= 0 ? args[outIndex + 1] : undefined }), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
