import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createOnboardingFiles } from '../../onboard.mjs';

test('onboarding creates private firm source files without overwriting by default', () => {
 const root=mkdtempSync(join(tmpdir(),'consulting-ops-onboard-')); const previous=process.cwd();
 try{process.chdir(root);const answers={firm_name:'Example Consulting',services:'Strategy, Coaching',client_types:'nonprofit',geographies:'remote',teaming_allowed:'yes'};const first=createOnboardingFiles(answers);const second=createOnboardingFiles({...answers,firm_name:'Changed'});assert.equal(first.files[0].status,'created');assert.equal(second.files[0].status,'preserved');assert.match(readFileSync('config/company_profile.yml','utf8'),/Example Consulting/);assert.match(readFileSync('capability_statement.md','utf8'),/Strategy/);}finally{process.chdir(previous);rmSync(root,{recursive:true,force:true})}
});

test('onboarding can initialize an explicit workspace target', () => {
  const root = mkdtempSync(join(tmpdir(), 'consulting-ops-target-'));
  try {
    createOnboardingFiles({ firm_name: 'Target Firm', services: 'Facilitation', teaming_allowed: 'yes' }, { root });
    assert.match(readFileSync(join(root, 'config/company_profile.yml'), 'utf8'), /Target Firm/);
    assert.match(readFileSync(join(root, 'capability_statement.md'), 'utf8'), /Facilitation/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
