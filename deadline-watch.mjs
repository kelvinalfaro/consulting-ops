#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTracker } from './lib/tracker-store.mjs';

export function deadlineReport(rows, now=new Date(), horizonDays=30){
 const active=new Set(['Discovered','Qualified','Evaluated','Bid','Drafting','Review']);
 return rows.filter((row)=>active.has(row.status)).map((row)=>{const due=new Date(row.due);if(Number.isNaN(due.valueOf()))return {...row,deadline_state:'unknown',days_remaining:null};const days=Math.ceil((due-now)/86400000);return {...row,deadline_state:days<0?'overdue':days<=7?'urgent':days<=horizonDays?'upcoming':'later',days_remaining:days}}).sort((a,b)=>(a.days_remaining??99999)-(b.days_remaining??99999));
}
function markdown(items){return `# RFP deadline watch\n\nGenerated: ${new Date().toISOString()}\n\n| # | Issuer | Opportunity | Status | Due | Days | Signal |\n|---|---|---|---|---|---|---|\n${items.map((r)=>`| ${r['#']} | ${r.issuer} | ${r.opportunity} | ${r.status} | ${r.due||'Unknown'} | ${r.days_remaining??'—'} | ${r.deadline_state} |`).join('\n')}\n`;}
function main(){const args=process.argv.slice(2);const index=args.indexOf('--days');const items=deadlineReport(readTracker(),new Date(),index>=0?Number(args[index+1]):30);if(args.includes('--json'))console.log(JSON.stringify(items,null,2));else console.log(markdown(items));if(items.some((r)=>r.deadline_state==='overdue'))process.exitCode=2;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
