#!/usr/bin/env node

import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

const port = Number(process.env.PORT || process.argv[2] || 4173);
const file = resolve('dashboard/index.html');
if (!existsSync(file)) throw new Error('dashboard/index.html not found. Run npm run build:dashboard first.');
createServer((request, response) => {
  if (!['/', '/index.html'].includes(request.url)) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`consulting-ops dashboard: http://127.0.0.1:${port}`));
