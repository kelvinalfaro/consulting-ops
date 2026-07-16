#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { installSkill } from './install-skill.mjs';
import { markWorkspace, saveDefaultWorkspace } from './lib/workspace.mjs';

const systemRoot = dirname(fileURLToPath(import.meta.url));
function option(args, name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }
function run(script, args, cwd) {
  const result = spawnSync(process.execPath, [resolve(systemRoot, script), ...args], { cwd, stdio: 'inherit', env: { ...process.env, CONSULTING_OPS_WORKSPACE: cwd } });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

async function chooseWorkspace(args) {
  const supplied = option(args, '--workspace') ?? process.env.CONSULTING_OPS_WORKSPACE;
  if (supplied) return resolve(supplied);
  if (args.includes('--yes') || !process.stdin.isTTY) return resolve('consulting-ops-workspace');
  const rl = createInterface({ input, output });
  const answer = await rl.question(`Private workspace [${resolve('consulting-ops-workspace')}]: `);
  rl.close(); return resolve(answer.trim() || 'consulting-ops-workspace');
}

export async function setup(args = process.argv.slice(2)) {
  const workspace = await chooseWorkspace(args);
  markWorkspace(workspace);
  const config = saveDefaultWorkspace(workspace);
  const doctorBefore = spawnSync(process.execPath, [resolve(systemRoot, 'doctor.mjs'), '--json', '--target', workspace], { encoding: 'utf8' });
  const state = doctorBefore.status === 0 ? JSON.parse(doctorBefore.stdout) : { onboardingNeeded: true };
  let onboarding = 'already-complete';
  if (state.onboardingNeeded && !args.includes('--skip-onboard')) {
    const onboardArgs = ['--target', workspace];
    const answers = option(args, '--answers'); if (answers) onboardArgs.push('--answers', resolve(answers));
    if (args.includes('--force')) onboardArgs.push('--force');
    if (!answers && (args.includes('--yes') || !process.stdin.isTTY)) onboarding = 'required';
    else { const status = run('onboard.mjs', onboardArgs, workspace); if (status !== 0) throw new Error('Onboarding failed'); onboarding = 'completed'; }
  }
  const agent = option(args, '--agent') ?? 'portable';
  const installed = installSkill({ agent });
  const doctorStatus = run('doctor.mjs', ['--target', workspace], workspace);
  return { product: 'consulting-ops', system: systemRoot, workspace, config: config.path, onboarding, agent, installed, ready: doctorStatus === 0 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  setup().then((result) => { console.log(`\n${JSON.stringify(result, null, 2)}`); if (!result.ready) process.exitCode = 1; })
    .catch((error) => { console.error(error.message); process.exit(1); });
}
