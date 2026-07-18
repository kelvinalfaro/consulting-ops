#!/usr/bin/env node

/** Consulting-native equivalents of career-ops training, project, and adjacent-title modes. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

function clean(value) { return String(value ?? '').replace(/[\r\n]+/g, ' ').trim(); }
function slug(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'assessment'; }

const labels = {
  training: { title: 'Training or certification assessment', subject: 'Course / credential' },
  service: { title: 'Service or portfolio-offering assessment', subject: 'Service / offering idea' },
  adjacent: { title: 'Adjacent opportunity targeting assessment', subject: 'Target market / service family' },
  jurisdiction: { title: 'Jurisdiction and market-entry assessment', subject: 'Jurisdiction / procurement market' },
};

function configuredFirmName(options = {}) {
  if (clean(options.firmName)) return clean(options.firmName);
  const profilePath = resolve(options.profilePath ?? 'config/company_profile.yml');
  if (!existsSync(profilePath)) return 'the consulting firm';
  try {
    return clean(yaml.load(readFileSync(profilePath, 'utf8'))?.firm?.name) || 'the consulting firm';
  } catch {
    return 'the consulting firm';
  }
}

export function createGrowthAssessment(mode, subject, options = {}) {
  if (!labels[mode]) throw new Error(`Unsupported assessment mode: ${mode}`);
  const name = clean(subject);
  if (!name) throw new Error(`${labels[mode].subject} is required`);
  const sources = [
    'capability_statement.md', 'config/company_profile.yml', 'case-studies/', 'team/',
    'writing-samples/', 'modes/_company_profile.md', 'modes/_custom.md',
  ];
  const path = resolve(options.output ?? `reports/${mode}-${slug(name)}.md`);
  const firmName = configuredFirmName(options);
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path) && !options.force) throw new Error(`Assessment already exists: ${path}`);
  const text = `# ${labels[mode].title}: ${name}\n\n## Decision to make\n\nShould ${firmName} invest time, money, positioning, or pipeline attention in **${name}**?\n\n## Evidence boundary\n\nUse only approved firm sources and current user-supplied facts. Relevant source locations:\n${sources.map((source) => `- ${source}${existsSync(source.replace(/\/$/, '')) ? '' : ' — not currently present'}`).join('\n')}\n\n## Assessment\n\n| Dimension | Evidence | Rating | Confidence | Gap / validation needed |\n|---|---|---|---|---|\n| Strategic fit | | Unknown | Low | |\n| Client demand signal | | Unknown | Low | |\n| Capability and credibility | | Unknown | Low | |\n| Differentiation | | Unknown | Low | |\n| Effort, cost, and capacity | | Unknown | Low | |\n| Near-term pipeline value | | Unknown | Low | |\n| Long-term option value | | Unknown | Low | |\n\n## Recommendation\n\n**Decision:** Needs evidence\n\n**Why:** [Complete after evidence review.]\n\n## Next validation step\n\n- [ ] Identify the smallest bounded test that would change the decision.\n- [ ] Define a stop condition before investing further.\n- [ ] Update firm positioning or search configuration only after human confirmation.\n`;
  writeFileSync(path, text, 'utf8');
  return { mode, subject: name, path, decision: 'Needs evidence' };
}

function main() {
  const [mode, ...args] = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const subject = args.filter((_, index) => index !== outIndex && index !== outIndex + 1 && args[index] !== '--force').join(' ');
  return createGrowthAssessment(mode, subject, { output: outIndex >= 0 ? args[outIndex + 1] : undefined, force: args.includes('--force') });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(main(), null, 2)); } catch (error) { console.error(error.message); process.exit(1); }
}
