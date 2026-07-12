#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processPipeline } from './process-pipeline.mjs';
const args=process.argv.slice(2); const index=args.indexOf('--limit');
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) processPipeline({limit:index>=0?Number(args[index+1]):20}).then((result)=>{console.log(JSON.stringify(result,null,2));if(result.results.some((item)=>!item.ok))process.exitCode=2}).catch((error)=>{console.error(error.message);process.exit(1)});
