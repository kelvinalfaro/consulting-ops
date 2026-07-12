import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { exportProposal } from '../../export-proposal.mjs';
test('exports review-marked proposal PDF and DOCX',async()=>{const root=mkdtempSync(join(tmpdir(),'consulting-ops-export-'));try{const source=join(root,'proposal.md');writeFileSync(source,'# Proposal\n\n## Approach\n\n- Facilitate discovery.');const result=await exportProposal(source);assert.equal(readFileSync(result.pdf).subarray(0,4).toString(),'%PDF');assert.deepEqual([...readFileSync(result.docx).subarray(0,2)],[0x50,0x4b]);}finally{rmSync(root,{recursive:true,force:true})}});
