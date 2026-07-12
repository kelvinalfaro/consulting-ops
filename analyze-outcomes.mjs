#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTracker } from './lib/tracker-store.mjs';
export function analyzeOutcomes(rows,debriefText=''){const outcomes=rows.filter((r)=>['Won','Lost'].includes(r.status));const won=outcomes.filter((r)=>r.status==='Won').length;const reasons={};for(const line of debriefText.split(/\r?\n/).slice(1)){const cells=line.split('\t');if(cells[3])reasons[cells[3]]=(reasons[cells[3]]??0)+1}return{sample_size:outcomes.length,won,lost:outcomes.length-won,win_rate:outcomes.length?Math.round(won/outcomes.length*100):null,small_sample:outcomes.length<10,top_reasons:Object.entries(reasons).sort((a,b)=>b[1]-a[1]).map(([reason,count])=>({reason,count}))}}
function main(){const path=resolve('data/debriefs.tsv');console.log(JSON.stringify(analyzeOutcomes(readTracker(),existsSync(path)?readFileSync(path,'utf8'):''),null,2))}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
