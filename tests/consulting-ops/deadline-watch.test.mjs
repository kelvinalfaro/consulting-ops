import test from 'node:test';
import assert from 'node:assert/strict';
import { deadlineReport } from '../../deadline-watch.mjs';

test('deadline watch distinguishes overdue, urgent, and unknown deadlines',()=>{const now=new Date(2027, 0, 10);const rows=[{'#':'1',status:'Bid',due:'2027-01-09',issuer:'A',opportunity:'Past'},{'#':'2',status:'Drafting',due:'2027-01-15',issuer:'B',opportunity:'Soon'},{'#':'3',status:'Evaluated',due:'',issuer:'C',opportunity:'Unknown'}];const result=deadlineReport(rows,now);assert.equal(result[0].deadline_state,'overdue');assert.ok(result.some((r)=>r.deadline_state==='urgent'));assert.ok(result.some((r)=>r.deadline_state==='unknown'));});

test('date-only deadlines use local calendar days late in the evening', () => {
  const rows = [
    { status: 'Bid', due: '2027-01-09' },
    { status: 'Bid', due: '2027-01-10' },
    { status: 'Bid', due: '2027-01-11' },
  ];
  const result = deadlineReport(rows, new Date(2027, 0, 10, 23, 30));
  assert.deepEqual(result.map((row) => row.days_remaining), [-1, 0, 1]);
});
