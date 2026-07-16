#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const systemRoot = dirname(fileURLToPath(import.meta.url));
const source = join(systemRoot, '.agents', 'skills', 'consulting-concierge');

export function skillDestinations(agent = 'portable', home = homedir()) {
  const roots = {
    portable: join(home, '.agents', 'skills'), codex: join(home, '.codex', 'skills'),
    gemini: join(home, '.gemini', 'skills'), claude: join(home, '.claude', 'skills'),
  };
  const names = agent === 'all' ? Object.keys(roots) : String(agent).split(',').map((item) => item.trim()).filter(Boolean);
  return [...new Set(names.map((name) => {
    if (!roots[name]) throw new Error(`Unknown agent target: ${name}. Use portable, codex, gemini, claude, or all.`);
    return join(roots[name], 'consulting-concierge');
  }))];
}

export function installSkill(options = {}) {
  if (!existsSync(source)) throw new Error(`Bundled skill is missing: ${source}`);
  const version = readFileSync(join(systemRoot, 'VERSION'), 'utf8').trim();
  const installed = [];
  const home = options.home ?? process.env.CONSULTING_OPS_SKILLS_HOME ?? homedir();
  for (const destination of skillDestinations(options.agent, home)) {
    mkdirSync(dirname(destination), { recursive: true });
    rmSync(destination, { recursive: true, force: true });
    cpSync(source, destination, { recursive: true, force: true });
    installed.push({ destination: resolve(destination), version });
  }
  return installed;
}

function main() {
  const args = process.argv.slice(2); const index = args.indexOf('--agent');
  const agent = index >= 0 ? args[index + 1] : 'portable';
  console.log(JSON.stringify({ skill: 'consulting-concierge', installed: installSkill({ agent }) }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
