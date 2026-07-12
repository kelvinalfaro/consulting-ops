#!/usr/bin/env node

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAutoPipeline } from './auto-pipeline.mjs';

export function pendingItems(markdown) {
  return markdown.split(/\r?\n/).map((line, index) => ({ line, index })).filter(({ line }) => /^\s*- \[ \]\s+/.test(line)).map((item) => {
    const raw = item.line.replace(/^\s*- \[ \]\s+/, '').trim();
    const source = raw.split(/\s+\|\s+/)[0].trim();
    return { ...item, raw, source };
  }).filter((item) => item.source);
}

export async function processPipeline(options = {}) {
  const path = resolve(options.path ?? 'data/rfp_pipeline.md');
  if (!existsSync(path)) throw new Error(`Pipeline not found: ${path}`);
  let markdown = readFileSync(path, 'utf8'); const items = pendingItems(markdown); const results = [];
  for (const item of items.slice(0, options.limit ?? items.length)) {
    try {
      const result = await runAutoPipeline(item.source, options);
      results.push({ source: item.source, ok: true, decision: result.evaluation.decision, record: result.record });
      markdown = markdown.replace(item.line, item.line.replace('- [ ]', '- [x]') + ` | ${result.evaluation.decision}`);
    } catch (error) {
      results.push({ source: item.source, ok: false, error: error.message });
      markdown = markdown.replace(item.line, item.line + ` | ERROR: ${error.message.replace(/\|/g, '/')}`);
    }
    const temp = `${path}.${process.pid}.tmp`; writeFileSync(temp, markdown, 'utf8'); renameSync(temp, path);
  }
  return { pending: items.length, processed: results.length, results };
}

async function main() {
  const args = process.argv.slice(2); const limitIndex = args.indexOf('--limit');
  const result = await processPipeline({ limit: limitIndex >= 0 ? Number(args[limitIndex + 1]) : undefined });
  console.log(JSON.stringify(result, null, 2)); if (result.results.some((item) => !item.ok)) process.exitCode = 2;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exit(1); });
