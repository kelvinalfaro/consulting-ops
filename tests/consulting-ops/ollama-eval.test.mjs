import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('local Ollama RFP evaluator loads approved firm context and repairs a missing summary', async () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-ollama-'));
  const requests = [];
  const blocks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((label) => `## ${label}\nTest`).join('\n\n');
  const summary = `---RFP_SUMMARY---\nID: RFP-TEST\nISSUER: Test Agency\nTITLE: Strategic Planning Services\nSCORE: 4.2\nRECOMMENDATION: Conditional Bid\nBUDGET_RELIABILITY: Medium\n---END_SUMMARY---`;
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/tags') { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"models":[]}'); return; }
    if (req.method === 'POST' && req.url === '/api/chat') {
      let body = ''; req.setEncoding('utf8'); req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => { requests.push(JSON.parse(body)); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ message: { content: requests.length === 1 ? blocks : summary } })); });
      return;
    }
    res.writeHead(404); res.end();
  });

  try {
    mkdirSync(join(root, 'modes'), { recursive: true }); mkdirSync(join(root, 'config'), { recursive: true });
    writeFileSync(join(root, 'ollama-eval.mjs'), readFileSync(join(process.cwd(), 'ollama-eval.mjs')));
    writeFileSync(join(root, 'modes', '_shared_rfp.md'), 'SHARED-MARKER'); writeFileSync(join(root, 'modes', 'rfp.md'), 'RFP-MODE-MARKER');
    writeFileSync(join(root, 'modes', '_company_profile.md'), 'POSITIONING-MARKER'); writeFileSync(join(root, 'modes', '_custom.md'), 'CUSTOM-MARKER');
    writeFileSync(join(root, 'config', 'company_profile.yml'), 'PROFILE-MARKER'); writeFileSync(join(root, 'capability_statement.md'), 'CAPABILITY-MARKER');
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const port = server.address().port;
    const result = await new Promise((resolve) => {
      const child = spawn(process.execPath, ['ollama-eval.mjs', '--no-save', 'SOURCE-MARKER'], { cwd: root, env: { ...process.env, OLLAMA_BASE_URL: `http://127.0.0.1:${port}`, OLLAMA_MODEL: 'test-model' }, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = ''; let stderr = ''; child.stdout.on('data', (chunk) => { stdout += chunk; }); child.stderr.on('data', (chunk) => { stderr += chunk; }); child.on('close', (code) => resolve({ code, stdout, stderr }));
    });
    assert.equal(result.code, 0, result.stderr);
    assert.equal(requests.length, 2);
    const prompt = requests[0].messages.find((message) => message.role === 'system').content;
    for (const marker of ['SHARED-MARKER', 'RFP-MODE-MARKER', 'POSITIONING-MARKER', 'CUSTOM-MARKER', 'PROFILE-MARKER', 'CAPABILITY-MARKER']) assert.match(prompt, new RegExp(marker));
    assert.equal(requests[0].think, false); assert.equal(requests[0].options.num_predict, 8192);
    assert.match(result.stdout, /Conditional Bid/); assert.match(result.stdout, /Repairing missing/);
  } finally {
    await new Promise((resolve) => server.close(resolve)); rmSync(root, { recursive: true, force: true });
  }
});
