import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export const PRIMARY_COMMANDS = [
  ['<RFP/RFQ URL or file>', 'capture, extract, evaluate, track, and conditionally create a proposal workspace'],
  ['scan', 'discover current consulting opportunities'],
  ['pipeline', 'process sources in data/rfp_pipeline.md'],
  ['tracker', 'summarize pursuit statuses and metrics'],
  ['evaluate', 'run hard gates and weighted bid/no-bid evaluation'],
  ['proposal', 'build the compliance matrix, outline, and source-grounded response workspace'],
  ['apply', 'prepare portal fields and attachments; always stops before submission'],
  ['letter', 'draft a source-grounded cover letter or letter of interest'],
  ['email', 'draft procurement or follow-up correspondence; never sends'],
  ['contact', 'prepare a procurement contact brief'],
  ['finalist', 'prepare for a finalist event; plan, practice, and debrief submodes are available'],
  ['compare', 'compare and rank pursuits'],
  ['contract', 'review contract issues for professional or legal follow-up'],
  ['followup', 'identify due follow-ups and prepare drafts'],
  ['patterns', 'analyze pursuit outcomes and improve targeting'],
  ['adjacent', 'identify and test adjacent opportunity targets'],
  ['dashboard', 'build the local pursuit dashboard'],
  ['update', 'preview and apply system updates'],
];

export const ADVANCED_COMMANDS = [
  'research', 'evidence', 'evidence-add', 'amend', 'submission', 'export', 'finalist-plan',
  'finalist-practice', 'finalist-debrief', 'inbox', 'agent-inbox', 'deadlines', 'debrief',
  'training', 'service', 'jurisdiction', 'doctor',
];

function systemRun(script, args = []) {
  const result = spawnSync(process.execPath, [join(root, script), ...args], {
    cwd: process.cwd(), encoding: 'utf8', env: process.env,
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '', error: result.error?.message ?? null };
}

function parseJson(result, label, required = true) {
  if (result.error || result.status !== 0) {
    if (!required) return null;
    throw new Error(`${label} failed: ${result.error ?? result.stderr.trim() ?? `exit ${result.status}`}`);
  }
  try { return JSON.parse(result.stdout); }
  catch (error) {
    if (!required) return null;
    throw new Error(`${label} returned invalid JSON: ${error.message}`);
  }
}

export function getCommandCenterStatus(options = {}) {
  const run = options.run ?? ((script, args = []) => {
    const result = spawnSync(process.execPath, [join(root, script), ...args], {
      cwd: options.cwd ?? process.cwd(), encoding: 'utf8',
      env: { ...process.env, CONSULTING_OPS_WORKSPACE: options.cwd ?? process.cwd() },
    });
    return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '', error: result.error?.message ?? null };
  });
  const localVersion = options.localVersion ?? readFileSync(join(root, 'VERSION'), 'utf8').trim();
  const doctor = parseJson(run('doctor.mjs', ['--json']), 'Setup check');
  const update = parseJson(run('update-system.mjs', ['check']), 'Update check', false);
  return {
    product: 'consulting-ops',
    ready: !doctor.onboardingNeeded,
    onboarding_needed: Boolean(doctor.onboardingNeeded),
    missing: doctor.missing ?? [],
    warnings: doctor.warnings ?? [],
    local_version: update?.local ?? localVersion,
    update: update ?? { status: 'unavailable', local: localVersion },
    primary_commands: PRIMARY_COMMANDS.map(([command, description]) => ({ command, description })),
    advanced_commands: [...ADVANCED_COMMANDS],
    submission_performed: false,
  };
}

function statusLine(status) {
  if (!status.ready) {
    const missing = status.missing.length ? status.missing.map((item) => item.path ?? item).join(', ') : 'required onboarding information';
    return `Status: Setup required. Missing: ${missing}. Run \`consulting-ops setup\` before other workflows.`;
  }
  if (status.update.status === 'update-available') {
    return `Status: Ready. Update available: v${status.update.remote} (local v${status.local_version}).`;
  }
  return `Status: Ready. Setup complete; no newer release is available (local v${status.local_version}).`;
}

export function renderCommandCenter(status) {
  const lines = ['consulting-ops — Command Center', '', statusLine(status)];
  if (!status.ready) return `${lines.join('\n')}\n`;
  lines.push('', ...status.primary_commands.map(({ command, description }) => `- ${command} — ${description}`));
  lines.push('', `More: ${status.advanced_commands.join(', ')}. Run \`node consulting-ops.mjs more\` for the full reference.`, '', 'Tell me a mode, or paste an RFP/RFQ URL or file.');
  return `${lines.join('\n')}\n`;
}
