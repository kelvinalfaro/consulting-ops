#!/usr/bin/env node

/** Stage a new firm proof point for review before it enters an approved evidence source. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function clean(value) { return String(value ?? '').replace(/[\r\n]+/g, ' ').trim(); }
function slug(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'evidence'; }

export function stageEvidenceIntake(source, options = {}) {
  const input = clean(source);
  if (!input) throw new Error('A source URL, file, or description is required');
  const local = existsSync(resolve(input));
  const sourceLabel = local ? resolve(input) : input;
  const sourceText = local ? readFileSync(resolve(input), 'utf8').slice(0, 12000) : '';
  const path = resolve(options.output ?? `reports/evidence-intake-${slug(local ? basename(input) : input)}.md`);
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path) && !options.force) throw new Error(`Evidence intake already exists: ${path}`);
  const text = `# Firm evidence intake\n\n**Source:** ${sourceLabel}\n**Source type:** ${local ? 'Local file' : /^https?:\/\//i.test(input) ? 'URL' : 'User description'}\n**Approval status:** Staged — not approved for proposal claims\n\n## Candidate evidence\n\n- Evidence type: [Case study / team credential / writing sample / capability / other]\n- Client or context: [Confirm disclosure permission]\n- Work performed: [Source-grounded]\n- Outcomes and measures: [Exact evidence only]\n- Dates and role: [Confirm]\n- Reusable claim wording: [Draft]\n\n## Verification\n\n- [ ] Authorship and role verified\n- [ ] Outcome and metric source verified\n- [ ] Confidentiality and client-name permission verified\n- [ ] Destination approved: case-studies/, team/, writing-samples/, or capability_statement.md\n- [ ] Exact destination diff shown to the user\n- [ ] User explicitly approved the write\n\n## Source excerpt\n\n${sourceText ? `\`\`\`text\n${sourceText}\n\`\`\`` : '[Fetch or paste the authoritative source before approval.]'}\n\n> Staging this intake does not make its contents approved evidence. An authorized human must review the exact destination diff.\n`;
  writeFileSync(path, text, 'utf8');
  return { source: sourceLabel, path, approved: false };
}

function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const source = args.filter((_, index) => index !== outIndex && index !== outIndex + 1 && args[index] !== '--force').join(' ');
  console.log(JSON.stringify(stageEvidenceIntake(source, { output: outIndex >= 0 ? args[outIndex + 1] : undefined, force: args.includes('--force') }), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
