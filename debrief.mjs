#!/usr/bin/env node
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTrackedStatus } from './lib/tracker-store.mjs';
function clean(value){return String(value??'').replace(/[\t\r\n]+/g,' ').trim()}
export function recordDebrief(id,outcome,details={},path=resolve('data/debriefs.tsv')){const allowed=['Won','Lost','No Bid','Withdrawn','Cancelled'];if(!allowed.includes(outcome))throw new Error(`Outcome must be one of: ${allowed.join(', ')}`);mkdirSync(dirname(path),{recursive:true});if(!existsSync(path))writeFileSync(path,'date\tid\toutcome\treason\tfeedback\tprice_feedback\tnext_action\n','utf8');appendFileSync(path,[new Date().toISOString().slice(0,10),id,outcome,details.reason,details.feedback,details.price_feedback,details.next_action].map(clean).join('\t')+'\n','utf8');const tracker=setTrackedStatus(id,outcome);return{path,id,outcome,tracker}}
function main(){const args=process.argv.slice(2);const[id,outcome]=args;const get=(flag)=>{const index=args.indexOf(flag);return index>=0?args[index+1]:''};if(!id||!outcome||args.includes('--help')){console.log('Usage: node debrief.mjs <id> <Won|Lost|No Bid|Withdrawn|Cancelled> [--reason text] [--feedback text] [--price text] [--next text]');process.exit(id&&outcome?0:1)}console.log(JSON.stringify(recordDebrief(id,outcome,{reason:get('--reason'),feedback:get('--feedback'),price_feedback:get('--price'),next_action:get('--next')}),null,2))}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main()}catch(error){console.error(error.message);process.exit(1)}}
