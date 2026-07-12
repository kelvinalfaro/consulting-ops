#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { evaluateOpportunity } from './lib/rfp-evaluation.mjs';
function read(path){const text=readFileSync(resolve(path),'utf8');return extname(path)==='.json'?JSON.parse(text):yaml.load(text)}
export function compareOpportunities(files,profile={}){return files.map((file)=>{const opportunity=read(file);const evaluation=evaluateOpportunity(opportunity,profile);return{id:opportunity.id,issuer:opportunity.issuer,title:opportunity.title,due:opportunity.proposal_due,budget:opportunity.budget,decision:evaluation.decision,score:evaluation.scoring.score,coverage:evaluation.scoring.coverage,failed_gates:evaluation.gates.filter((g)=>g.status==='fail').map((g)=>g.id),unknown_gates:evaluation.gates.filter((g)=>g.status==='unknown').map((g)=>g.id)}}).sort((a,b)=>{const viable=(x)=>x.failed_gates.length?0:x.unknown_gates.length?1:2;return viable(b)-viable(a)||(b.score??0)-(a.score??0)})}
function main(){const files=process.argv.slice(2).filter((arg)=>!arg.startsWith('--'));if(files.length<2){console.log('Usage: node compare-rfps.mjs <one.yml> <two.yml> [...]');process.exit(1)}const profile=existsSync('config/company_profile.yml')?read('config/company_profile.yml'):{};console.log(JSON.stringify(compareOpportunities(files,profile),null,2))}if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
