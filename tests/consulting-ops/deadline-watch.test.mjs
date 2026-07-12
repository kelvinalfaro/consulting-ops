import test from 'node:test';
import assert from 'node:assert/strict';
import { deadlineReport } from '../../deadline-watch.mjs';

test('deadline watch distinguishes overdue, urgent, and unknown deadlines',()=>{const now=new Date('2027-01-10T00:00:00Z');const rows=[{'#':'1',status:'Bid',due:'2027-01-09',issuer:'A',opportunity:'Past'},{'#':'2',status:'Drafting',due:'2027-01-15',issuer:'B',opportunity:'Soon'},{'#':'3',status:'Evaluated',due:'',issuer:'C',opportunity:'Unknown'}];const result=deadlineReport(rows,now);assert.equal(result[0].deadline_state,'overdue');assert.ok(result.some((r)=>r.deadline_state==='urgent'));assert.ok(result.some((r)=>r.deadline_state==='unknown'));});
