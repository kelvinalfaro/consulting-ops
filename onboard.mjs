#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import yaml from 'js-yaml';

function split(value) { return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean); }
const systemRoot = dirname(fileURLToPath(import.meta.url));
function template(path) { return readFileSync(resolve(systemRoot, path), 'utf8'); }
function safeWrite(root, path, content, force = false) {
  const absolute = resolve(root, path); if (existsSync(absolute) && !force) return { path, status: 'preserved' };
  mkdirSync(dirname(absolute), { recursive: true }); writeFileSync(absolute, content, 'utf8'); return { path, status: 'created' };
}

export function createOnboardingFiles(answers, options = {}) {
  const root = resolve(options.root ?? '.');
  const profile = {
    firm: { name: answers.firm_name, website: answers.website || null, location: answers.location || null,
      contact_name: answers.contact_name || null, contact_email: answers.contact_email || null,
      certifications: split(answers.certifications), classification_codes: split(answers.classification_codes) },
    services: split(answers.services).map((name) => ({ name, description: '' })),
    target_engagements: { client_types: split(answers.client_types), geographies: split(answers.geographies),
      minimum_budget: answers.minimum_budget ? Number(answers.minimum_budget) : null, preferred_duration: answers.preferred_duration || null },
    capacity: { available_from: answers.available_from || null, concurrent_engagements: answers.concurrent_engagements ? Number(answers.concurrent_engagements) : null,
      teaming_allowed: answers.teaming_allowed !== 'no' },
    commercial: { currency: answers.currency || 'USD', preferred_models: split(answers.pricing_models || 'fixed fee, phased'), pricing_requires_human_review: true },
    proposal: { default_validity_days: Number(answers.validity_days || 30), submission_requires_human_review: true },
  };
  const capability = `# ${answers.firm_name} capability statement\n\n## Company profile\n\n${answers.summary || '[Add an approved firm summary.]'}\n\n## Core competencies\n\n${split(answers.services).map((item) => `- ${item}: [Add a specific, supportable description.]`).join('\n')}\n\n## Differentiators\n\n- [Add supported differentiators.]\n\n## Past performance\n\nAdd approved case studies under \`case-studies/\`.\n\n## Key personnel\n\nAdd approved bios under \`team/\`.\n`;
  const companyMode = template('modes/_company_profile.template.md').replace('Firm-specific consulting-ops profile', `${answers.firm_name} pursuit profile`);
  const files = [
    safeWrite(root, 'config/company_profile.yml', yaml.dump(profile, { noRefs: true, lineWidth: 100 }), options.force),
    safeWrite(root, 'capability_statement.md', capability, options.force),
    safeWrite(root, 'modes/_company_profile.md', companyMode, options.force),
    safeWrite(root, 'modes/_custom.md', template('modes/_custom.template.md'), options.force),
    safeWrite(root, 'config/rfp_sources.yml', template('config/rfp_sources.example.yml'), options.force),
  ];
  for (const directory of ['case-studies', 'team', 'writing-samples', 'data/opportunities', 'reports', 'proposals']) mkdirSync(resolve(root, directory), { recursive: true });
  return { firm: answers.firm_name, files };
}

async function main() {
  const args = process.argv.slice(2); const answersIndex = args.indexOf('--answers');
  const targetIndex = args.indexOf('--target');
  const root = targetIndex >= 0 && args[targetIndex + 1] ? resolve(args[targetIndex + 1]) : resolve('.');
  if (answersIndex >= 0 && args[answersIndex + 1]) {
    const answers = JSON.parse(readFileSync(resolve(args[answersIndex + 1]), 'utf8'));
    console.log(JSON.stringify(createOnboardingFiles(answers, { force: args.includes('--force'), root }), null, 2)); return;
  }
  const rl = createInterface({ input, output });
  console.log('\nconsulting-ops onboarding\nFirm facts remain local and are ignored by Git. Unknowns can be completed later.\n');
  const ask = async (question, fallback = '') => (await rl.question(`${question}${fallback ? ` [${fallback}]` : ''}: `)).trim() || fallback;
  const answers = {};
  answers.firm_name = await ask('Firm name'); answers.contact_name = await ask('Primary contact name');
  answers.contact_email = await ask('Contact email'); answers.website = await ask('Website'); answers.location = await ask('Location');
  answers.summary = await ask('One-sentence firm summary'); answers.services = await ask('Core services, comma-separated');
  answers.client_types = await ask('Target client types, comma-separated', 'nonprofit, public sector, higher education');
  answers.geographies = await ask('Target geographies, comma-separated', 'remote'); answers.minimum_budget = await ask('Minimum engagement budget');
  answers.pricing_models = await ask('Preferred pricing models', 'fixed fee, phased'); answers.currency = await ask('Currency', 'USD');
  answers.teaming_allowed = await ask('Allow teaming/subcontracting? yes/no', 'yes'); answers.certifications = await ask('Certifications, comma-separated');
  answers.classification_codes = await ask('NAICS or other classification codes, comma-separated');
  rl.close(); console.log('\n' + JSON.stringify(createOnboardingFiles(answers, { force: args.includes('--force'), root }), null, 2));
  console.log('\nNext: review capability_statement.md, add case studies and team bios, then run `npx consulting-ops doctor`.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
