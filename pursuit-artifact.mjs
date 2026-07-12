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
  letter: (o) => `# Draft cover letter / letter of interest\n\n**Opportunity:** ${value(o.id)} — ${value(o.title)}\n**Issuer:** ${value(o.issuer)}\n**Authoritative source:** ${value(o.source_url ?? o.source_file)}\n\n[Date]\n\n[Authorized recipient]\n\nDear [Name or evaluation committee],\n\n[Opening grounded in the issuer's stated need and the solicitation.]\n\n[Concise firm fit using only approved capability, case-study, and team evidence.]\n\n[Specific approach or value proposition without adding unsupported commitments.]\n\nSincerely,\n\n[Authorized signer]\n\n## Review gates\n\n- [ ] Recipient and permitted communication channel verified\n- [ ] Every qualification claim mapped to an approved source\n- [ ] Conflicts, lobbying restrictions, and question deadlines checked\n- [ ] Authorized human approved and will send or include the letter\n`,
  'finalist-plan': (o) => `# Finalist preparation plan: ${value(o.title)}\n\n**Issuer:** ${value(o.issuer)}\n**Opportunity:** ${value(o.id)}\n\n## Session facts\n\n- Date/time/time zone: [Confirm]\n- Format/location/technology: [Confirm]\n- Duration and presentation limit: [Confirm]\n- Attendees/evaluators: [Confirm from authorized source]\n- Permitted materials: [Confirm]\n\n## Time-blocked preparation\n\n| Block | Objective | Owner | Artifact | Complete |\n|---|---|---|---|---|\n| T-7 days | Reconfirm evaluation criteria and format | | | [ ] |\n| T-5 days | Map criteria to evidence and speakers | | | [ ] |\n| T-3 days | Full timed rehearsal and gap log | | | [ ] |\n| T-1 day | Final technical and content check | | | [ ] |\n| Event day | Delivery, questions, and follow-up capture | | | [ ] |\n`,
  'finalist-practice': (o) => `# Finalist practice: ${value(o.title)}\n\nAsk one question at a time. Record the answer, evidence used, timing, and feedback before moving to the next question.\n\n| # | Likely question | Criterion | Evidence expected | Answer notes | Feedback |\n|---|---|---|---|---|---|\n${(o.evaluation_criteria ?? []).map((c, index) => `| ${index + 1} | How does your approach address ${value(c.name ?? c.text ?? c)}? | ${value(c.name ?? c.text ?? c)} | [Approved source] | | |`).join('\n') || '| 1 | What is your understanding of the need and why is your firm suited to it? | [Confirm] | [Approved source] | | |'}\n\n## Practice rules\n\n- Do not invent an answer when evidence is missing. Log the gap.\n- Distinguish commitments already in the proposal from optional ideas.\n- Keep procurement-sensitive questions within permitted boundaries.\n`,
  'finalist-debrief': (o) => `# Finalist debrief: ${value(o.title)}\n\n## Event record\n\n- Date and format: [Add]\n- Participants: [Add]\n- Questions asked: [Add]\n- Commitments or clarifications made: [Verify against recording/notes]\n- Materials provided: [Add]\n\n## Assessment\n\n- Strongest answers and evidence:\n- Weak or incomplete answers:\n- Buyer signals and concerns:\n- Follow-up explicitly requested:\n- New risks, scope signals, or contractual issues:\n\n## Actions\n\n| Action | Owner | Due | Permitted channel | Status |\n|---|---|---|---|---|\n| [Add] | | | | Open |\n\nDo not treat inferred buyer reactions as fact. Separate observations from interpretation.\n`,
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
    console.log('Usage: node pursuit-artifact.mjs <contact|email|contract|finalist|evidence|letter|finalist-plan|finalist-practice|finalist-debrief> <opportunity.yml|json> [--out file.md]');
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
