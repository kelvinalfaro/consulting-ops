#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTracker } from './lib/tracker-store.mjs';

export function followupCandidates(rows,now=new Date()){
 const rules={Submitted:7,Shortlisted:5,Won:7,Lost:3};return rows.filter((row)=>rules[row.status]).map((row)=>{const last=new Date(row.last_activity||row.identified);const days=Number.isNaN(last.valueOf())?null:Math.floor((now-last)/86400000);return{...row,days_since_activity:days,followup_due:days==null||days>=rules[row.status],suggested_type:row.status==='Lost'?'debrief request':row.status==='Won'?'award next-steps confirmation':'status follow-up'}}).filter((row)=>row.followup_due);
}
function render(rows){return `# Pursuit follow-ups\n\nGenerated: ${new Date().toISOString()}\n\n${rows.length?rows.map((row)=>`## ${row.issuer} — ${row.opportunity}\n\n**Status:** ${row.status}  \n**Days since activity:** ${row.days_since_activity??'Unknown'}  \n**Suggested action:** ${row.suggested_type}\n\n**Draft subject:** Follow-up: ${row.opportunity}\n\n**Draft:**\n\nHello,\n\nI am following up regarding ${row.opportunity}. Please let me know if any additional information would be useful at this stage.\n\nThank you,\n\n[Name]\n`).join('\n'): 'No follow-ups are due based on current tracker dates.\n'}`;}
function main(){const args=process.argv.slice(2);const rows=followupCandidates(readTracker());const text=render(rows);if(args.includes('--write')){writeFileSync(resolve('data/followups.md'),text,'utf8');console.log(JSON.stringify({file:resolve('data/followups.md'),count:rows.length},null,2))}else console.log(text)}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
