#!/usr/bin/env node

/** Create a reviewable proposal workspace from a normalized opportunity file. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

function readStructured(path) {
  const text = readFileSync(path, 'utf8');
  return extname(path).toLowerCase() === '.json' ? JSON.parse(text) : yaml.load(text);
}

function clean(value, fallback = 'Not recorded') {
  return value == null || value === '' ? fallback : String(value);
}

export function slug(value) {
  return String(value ?? 'opportunity').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'opportunity';
}

function requirementRows(items = []) {
  if (!items.length) return '| REQ-001 | Review source and identify requirements | Unknown | Unassigned | Open | |';
  return items.map((item, index) => {
    const value = typeof item === 'string' ? { text: item } : item;
    return `| REQ-${String(index + 1).padStart(3, '0')} | ${clean(value.text ?? value.name)} | ${clean(value.source, 'RFP; add page/section')} | ${clean(value.owner, 'Unassigned')} | ${clean(value.status, 'Open')} | ${clean(value.response_location, '')} |`;
  }).join('\n');
}

function attachmentRows(items = []) {
  if (!items.length) return '| Review source and identify attachments | Unassigned | Open | |';
  return items.map((item) => {
    const value = typeof item === 'string' ? { name: item } : item;
    return `| ${clean(value.name)} | ${clean(value.owner, 'Unassigned')} | ${clean(value.status, 'Open')} | ${clean(value.notes, '')} |`;
  }).join('\n');
}

export function buildWorkspaceFiles(opportunity, profile = {}) {
  const firm = profile.firm ?? {};
  const requirements = opportunity.mandatory_requirements ?? [];
  const attachments = opportunity.required_attachments ?? [];
  const criteria = opportunity.evaluation_criteria ?? [];
  return {
    'README.md': `# ${clean(opportunity.title, 'Untitled opportunity')}

**Issuer:** ${clean(opportunity.issuer)}
**Opportunity ID:** ${clean(opportunity.id)}
**Authoritative source:** ${clean(opportunity.source_url ?? opportunity.source_file)}
**Questions due:** ${clean(opportunity.questions_due)}
**Intent to bid due:** ${clean(opportunity.intent_to_bid_due)}
**Proposal due:** ${clean(opportunity.proposal_due)}
**Submission method:** ${clean(opportunity.submission?.method)}
**Workspace status:** Draft; not approved for submission

## Working sequence

1. Confirm the source and all amendments.
2. Complete the compliance matrix and clarification questions.
3. Confirm the bid decision, team, capacity, pricing assumptions, and terms.
4. Draft and review narrative against evaluation criteria.
5. Complete attachment and final-review checklists.
6. The user performs final submission.
`,
    'compliance-matrix.md': `# Compliance matrix

| ID | Requirement | Source/page | Owner | Status | Response location |
|---|---|---|---|---|---|
${requirementRows(requirements)}

## Required attachments

| Attachment | Owner | Status | Notes |
|---|---|---|---|
${attachmentRows(attachments)}

## Evaluation criteria

${criteria.length ? criteria.map((item) => `- ${typeof item === 'string' ? item : clean(item.name ?? item.text)}${item.weight ? ` (${item.weight})` : ''}`).join('\n') : '- Not recorded. Extract from the authoritative source before drafting.'}
`,
    'clarification-questions.md': `# Clarification questions

- [ ] Confirm every unknown mandatory requirement.
- [ ] Confirm budget, allowable expenses, and pricing format.
- [ ] Confirm submission format, page limits, attachments, and signatures.
- [ ] Confirm whether amendments or bidder conferences exist.
- [ ] Add opportunity-specific questions here before the question deadline.
`,
    'proposal-draft.md': `# Proposal draft: ${clean(opportunity.title, 'Untitled opportunity')}

> Working draft for human review. Do not submit from consulting-ops.

## Cover letter

[Draft after confirming the authorized signatory, submission instructions, and the client's stated need.]

## Executive summary

${clean(firm.name ?? firm.firm_name, '[Firm name]')} understands that ${clean(opportunity.issuer, '[issuer]')} is seeking ${clean(opportunity.scope_summary, '[summarize the need from the RFP]')}.

[State the recommended approach, intended outcomes, and supported differentiators. Every firm claim must trace to an approved source.]

## Understanding of need

[Describe the client's context and objectives using the RFP and amendments. Do not invent unstated problems.]

## Proposed approach and work plan

| Phase | Activities | Deliverables | Timing | Client participation |
|---|---|---|---|---|
| 1 | [To develop] | [To develop] | [To confirm] | [To confirm] |

## Team and roles

[Use approved bios from team/ or capability_statement.md. Confirm availability and teaming commitments.]

## Relevant experience

[Select only approved case studies that directly support the requirements. Retain evidence references during review.]

## Pricing

[Human review required. Confirm pricing form, assumptions, expenses, taxes, validity period, and contractual constraints.]

## Assumptions and dependencies

- [To confirm]

## Required forms and attachments

See compliance-matrix.md.
`,
    'review-checklist.md': `# Final review checklist

- [ ] Latest RFP and all amendments reviewed
- [ ] Bid decision and rationale documented
- [ ] Every mandatory requirement marked compliant or resolved
- [ ] Evaluation criteria addressed and easy to locate
- [ ] Page, format, naming, and file-size limits satisfied
- [ ] Claims and metrics verified against approved sources
- [ ] Team roles, availability, references, and partners confirmed
- [ ] Pricing and expenses approved by the user
- [ ] Legal terms, certifications, and representations reviewed
- [ ] Required forms, signatures, and attachments complete
- [ ] Dates, contact names, and submission channel rechecked
- [ ] Final files manually opened and visually reviewed
- [ ] User performs the final submission
`,
  };
}

export function createWorkspace(opportunity, profile, outputRoot = 'proposals') {
  const folder = resolve(outputRoot, slug(opportunity.id ?? `${opportunity.issuer}-${opportunity.title}`));
  if (existsSync(folder)) throw new Error(`Proposal workspace already exists: ${folder}`);
  mkdirSync(folder, { recursive: true });
  const files = buildWorkspaceFiles(opportunity, profile);
  for (const [name, content] of Object.entries(files)) writeFileSync(join(folder, name), content, 'utf8');
  return { folder, files: Object.keys(files) };
}

function main() {
  const args = process.argv.slice(2);
  const input = args.find((arg) => !arg.startsWith('--'));
  if (!input || args.includes('--help')) {
    console.log('Usage: node generate-proposal-draft.mjs <opportunity.yml|json> [--out proposals]');
    process.exit(input ? 0 : 1);
  }
  const inputPath = resolve(input);
  if (!existsSync(inputPath)) throw new Error(`Opportunity file not found: ${inputPath}`);
  const outIndex = args.indexOf('--out');
  const outputRoot = outIndex >= 0 && args[outIndex + 1] ? args[outIndex + 1] : 'proposals';
  const opportunity = readStructured(inputPath);
  const profilePath = resolve('config/company_profile.yml');
  const profile = existsSync(profilePath) ? readStructured(profilePath) : {};
  console.log(JSON.stringify(createWorkspace(opportunity, profile, outputRoot), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
