#!/usr/bin/env node

/** Local, private RFP evaluation through Ollama. Never submits a response. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

try { const { config } = await import('dotenv'); config({ quiet: true }); } catch { /* optional */ }

const ROOT = dirname(fileURLToPath(import.meta.url));
const PATHS = {
  shared: join(ROOT, 'modes', '_shared_rfp.md'), mode: join(ROOT, 'modes', 'rfp.md'),
  capability: join(ROOT, 'capability_statement.md'), profileYml: join(ROOT, 'config', 'company_profile.yml'),
  profileMode: join(ROOT, 'modes', '_company_profile.md'), custom: join(ROOT, 'modes', '_custom.md'), reports: join(ROOT, 'reports'),
};
const readContext = (path, label) => {
  if (!existsSync(path)) throw new Error(`Required local context is missing: ${label} (${path})`);
  return readFileSync(path, 'utf8').trim();
};
const slug = (value) => String(value || 'opportunity').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'opportunity';

function parseSummary(text) {
  const block = text.match(/---RFP_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/)?.[1] ?? '';
  const field = (name) => block.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, 'mi'))?.[1]?.trim() ?? '';
  return { id: field('ID'), issuer: field('ISSUER'), title: field('TITLE'), score: field('SCORE'), recommendation: field('RECOMMENDATION'), budget_reliability: field('BUDGET_RELIABILITY') };
}

function validate(text) {
  const issues = [];
  for (const label of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) if (!new RegExp(`(?:^|\\n)#{1,3}\\s*(?:${label}[).:-]?|Block ${label}\\b)`, 'im').test(text)) issues.push(`missing Block ${label}`);
  const summary = parseSummary(text);
  for (const key of ['issuer', 'title', 'recommendation', 'budget_reliability']) if (!summary[key]) issues.push(`missing summary ${key}`);
  const score = Number(summary.score);
  if (!Number.isFinite(score) || score < 0 || score > 5) issues.push('summary score must be 0-5');
  if (!['Bid', 'Conditional Bid', 'No Bid', 'Needs Clarification'].includes(summary.recommendation)) issues.push('invalid recommendation');
  if (issues.length) throw new Error(`Invalid local RFP evaluation: ${issues.join('; ')}`);
  return summary;
}

function usage(exitCode = 0) {
  console.log(`consulting-ops local RFP evaluator (Ollama / Qwen)\n\nUsage:\n  node ollama-eval.mjs --file <rfp.txt|md> [--model qwen3.5:latest]\n  node ollama-eval.mjs "<RFP text>" [--no-save]\n\nThe evaluator saves a review report only. It never updates the tracker or submits a proposal.`);
  process.exit(exitCode);
}

const args = process.argv.slice(2);
if (!args.length || args.includes('--help') || args.includes('-h')) usage(args.length ? 0 : 1);
let input = ''; let sourceLabel = 'inline RFP text'; let model = process.env.OLLAMA_MODEL || 'qwen3.5:latest';
let baseUrl = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
const save = !args.includes('--no-save');
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--file' && args[index + 1]) { const path = resolve(args[++index]); if (!existsSync(path)) throw new Error(`RFP file not found: ${path}`); input = readFileSync(path, 'utf8'); sourceLabel = path; }
  else if (args[index] === '--model' && args[index + 1]) model = args[++index];
  else if (args[index] === '--url' && args[index + 1]) baseUrl = args[++index].replace(/\/$/, '');
  else if (!args[index].startsWith('--')) input += `${input ? '\n' : ''}${args[index]}`;
}
if (!input.trim()) throw new Error('No RFP text was provided.');

let hostname; try { hostname = new URL(baseUrl).hostname; } catch { throw new Error(`Invalid OLLAMA_BASE_URL: ${baseUrl}`); }
if (!['localhost', '127.0.0.1', '::1'].includes(hostname) && process.env.OLLAMA_ALLOW_REMOTE !== '1') throw new Error('Remote Ollama endpoint blocked because the RFP and private firm evidence would leave this computer.');

const maxChars = Number(process.env.OLLAMA_MAX_INPUT_CHARS || 120000);
if (!Number.isInteger(maxChars) || maxChars <= 0) throw new Error('OLLAMA_MAX_INPUT_CHARS must be a positive integer.');
if (input.length > maxChars) console.warn(`Warning: analyzing the first ${maxChars} of ${input.length} characters. The source remains unchanged; review omitted appendices manually.`);
const sourceText = input.slice(0, maxChars);
const prompt = `You are consulting-ops, a local-first RFP pursuit assistant. Evaluate against only the approved firm sources below. Separate hard gates from weighted fit. Unknowns stay unknown. Never invent qualifications, pricing, certifications, past performance, or procurement facts. Never authorize submission.\n\n## Shared RFP rules\n${readContext(PATHS.shared, 'modes/_shared_rfp.md')}\n\n## RFP evaluation mode\n${readContext(PATHS.mode, 'modes/rfp.md')}\n\n## Approved capability statement\n${readContext(PATHS.capability, 'capability_statement.md')}\n\n## Company profile\n${readContext(PATHS.profileYml, 'config/company_profile.yml')}\n\n## Company positioning\n${readContext(PATHS.profileMode, 'modes/_company_profile.md')}\n\n## Custom rules\n${readContext(PATHS.custom, 'modes/_custom.md')}\n\nGenerate Blocks A-H. End with exactly:\n---RFP_SUMMARY---\nID: <solicitation ID or Unassigned>\nISSUER: <issuer or Unknown>\nTITLE: <title>\nSCORE: <0-5 decimal>\nRECOMMENDATION: <Bid | Conditional Bid | No Bid | Needs Clarification>\nBUDGET_RELIABILITY: <High | Medium | Low | Unknown>\n---END_SUMMARY---`;

const endpoint = `${baseUrl}/api/chat`;
const timeout = Number(process.env.OLLAMA_TIMEOUT_MS || 300000);
const request = async (messages, numPredict) => {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model, messages, stream: false, think: false, options: { temperature: 0.3, num_ctx: 32768, num_predict: numPredict } }), signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(`Ollama API error ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return (await response.json()).message?.content?.trim() ?? '';
};
const probe = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
if (!probe?.ok) throw new Error(`Ollama is not reachable at ${baseUrl}. Start Ollama and ensure ${model} is installed.`);
console.log(`Evaluating locally with Ollama (${model})...`);
let output = await request([{ role: 'system', content: prompt }, { role: 'user', content: `AUTHORITATIVE SOLICITATION SOURCE (${sourceLabel}):\n\n${sourceText}` }], 8192);
if (!/---RFP_SUMMARY---[\s\S]*?---END_SUMMARY---/.test(output)) {
  console.log('Repairing missing machine-readable summary locally...');
  const repaired = await request([{ role: 'system', content: 'Return only the exact ---RFP_SUMMARY--- block required by the evaluation instructions.' }, { role: 'user', content: output }], 512);
  const block = repaired.match(/---RFP_SUMMARY---[\s\S]*?---END_SUMMARY---/)?.[0]; if (block) output += `\n\n${block}`;
}
const summary = validate(output);
console.log(`\n${output}\n`);
if (save) {
  mkdirSync(PATHS.reports, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const identity = summary.id && summary.id.toLowerCase() !== 'unassigned' ? summary.id : `${summary.issuer}-${summary.title}`;
  const path = join(PATHS.reports, `${slug(identity)}-ollama-${date}.md`);
  writeFileSync(path, `# Local RFP evaluation: ${summary.issuer} - ${summary.title}\n\n**Source:** ${sourceLabel}\n**Model:** Ollama (${model})\n**Human review:** Required; this report does not update the tracker or authorize submission.\n\n---\n\n${output.replace(/---RFP_SUMMARY---[\s\S]*?---END_SUMMARY---/, '').trim()}\n`, 'utf8');
  console.log(`Saved review report: ${path}`);
}
