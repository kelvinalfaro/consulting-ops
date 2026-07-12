#!/usr/bin/env node

/** Create reviewable, source-grounded pursuit artifacts without sending or submitting anything. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { slug } from './generate-proposal-draft.mjs';

function readStructured(path) {
  const text = readFileSync(path, 'utf8');
  return extname(path).toLowerCase() === '.json' ? JSON.parse(text) : yaml.load(text);
}

function value(input, fallback = 'Not recorded') {
  return input == null || input === '' ? fallback : String(input);
}

const builders = {
  contact: (o) => `# Procurement contact brief: ${value(o.title)}\n\n**Issuer:** ${value(o.issuer)}\n**Opportunity:** ${value(o.id)}\n**Source:** ${value(o.source_url ?? o.source_file)}\n**Contact:** ${value(o.submission?.contact ?? o.contact?.email)}\n\n## Purpose\n\n[State the permitted procurement-related purpose.]\n\n## Questions\n\n- [ ] [Question tied to an ambiguity in the authoritative solicitation]\n\n## Controls\n\n- Confirm the question deadline and allowed communication channel.\n- Do not lobby evaluators or seek information unavailable to other bidders.\n- Human review and sending are required.\n`,
  email: (o) => `# Draft procurement email\n\n**To:** ${value(o.submission?.contact ?? o.contact?.email)}\n**Subject:** Clarification regarding ${value(o.id)} — ${value(o.title)}\n\nHello,\n\n[Insert a concise, solicitation-grounded question.]\n\nThank you,\n[Authorized sender]\n\n> Draft only. Verify the contact, permitted channel, deadline, attachments, and content before a human sends it.\n`,
  contract: (o) => `# Contract review checklist: ${value(o.title)}\n\n> Operational issue-spotting only; obtain qualified legal review when appropriate.\n\n| Area | Source clause/page | Position | Risk | Owner | Resolution |\n|---|---|---|---|---|---|\n| Scope and acceptance | | Unknown | | | |\n| Fees, expenses, and payment | | Unknown | | | |\n| Intellectual property | | Unknown | | | |\n| Confidentiality and data | | Unknown | | | |\n| Insurance and indemnity | | Unknown | | | |\n| Liability limits | | Unknown | | | |\n| Termination | | Unknown | | | |\n| Public records / publicity | | Unknown | | | |\n| Governing law / disputes | | Unknown | | | |\n`,
  finalist: (o) => `# Finalist preparation: ${value(o.title)}\n\n**Issuer:** ${value(o.issuer)}\n**Opportunity ID:** ${value(o.id)}\n\n## Evaluation map\n\n| Criterion | Weight | Proof point | Speaker | Likely question |\n|---|---|---|---|---|\n${(o.evaluation_criteria ?? []).map((c) => `| ${value(c.name ?? c.text ?? c)} | ${value(c.weight, '')} | | | |`).join('\n') || '| Not recorded | | | | |'}\n\n## Rehearsal\n\n- [ ] Confirm format, time, attendees, technology, and permitted materials.\n- [ ] Assign answer ownership and practice concise handoffs.\n- [ ] Verify every claim and client example.\n- [ ] Prepare questions that demonstrate understanding without assuming unstated facts.\n`,
  evidence: (o) => `# Evidence register: ${value(o.title)}\n\n| ID | Claim | Approved source | Location | Permission / confidentiality | Verified by | Status |\n|---|---|---|---|---|---|---|\n| E-001 | [Claim] | [File or authoritative URL] | [Page/section] | [Confirm] | [Owner] | Open |\n\nDo not use a claim until its wording, source, permission, and applicability are verified.\n`,
};

export function createPursuitArtifact(mode, opportunity, outputPath) {
  const builder = builders[mode];
  if (!builder) throw new Error(`Unsupported artifact mode: ${mode}`);
  const path = resolve(outputPath ?? join('reports', `${slug(opportunity.id ?? opportunity.title)}-${mode}.md`));
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) throw new Error(`Artifact already exists: ${path}`);
  writeFileSync(path, builder(opportunity), 'utf8');
  return path;
}

function main() {
  const [mode, input, ...args] = process.argv.slice(2);
  if (!builders[mode] || !input || args.includes('--help')) {
    console.log('Usage: node pursuit-artifact.mjs <contact|email|contract|finalist|evidence> <opportunity.yml|json> [--out file.md]');
    process.exit(mode && input ? 0 : 1);
  }
  const source = resolve(input);
  if (!existsSync(source)) throw new Error(`Opportunity file not found: ${source}`);
  const outIndex = args.indexOf('--out');
  const out = outIndex >= 0 ? args[outIndex + 1] : undefined;
  console.log(JSON.stringify({ mode, input: basename(source), output: createPursuitArtifact(mode, readStructured(source), out) }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
