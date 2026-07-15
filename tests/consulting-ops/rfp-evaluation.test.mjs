import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateHardGates,
  evaluateOpportunity,
  weightedScore,
} from '../../lib/rfp-evaluation.mjs';

const future = new Date('2027-01-01T17:00:00Z');
const now = new Date('2026-07-11T12:00:00Z');

function completeOpportunity(overrides = {}) {
  return {
    id: 'RFP-0001',
    title: 'Strategic planning facilitation',
    issuer: 'Example Agency',
    proposal_due: future.toISOString(),
    mandatory_requirements: [{ name: 'Insurance', status: 'met' }],
    capacity_status: 'available',
    terms_status: 'acceptable',
    scope_status: 'within',
    assessment: {
      scores: {
        capability_fit: 5,
        client_mission_fit: 4,
        approach_differentiation: 4,
        capacity_feasibility: 4,
        commercial_attractiveness: 4,
        procurement_win_conditions: 3,
        strategic_value: 4,
      },
    },
    ...overrides,
  };
}

test('expired deadline is a hard-gate failure', () => {
  const gates = evaluateHardGates(completeOpportunity({ proposal_due: '2026-01-01' }), {}, now);
  assert.equal(gates.find((gate) => gate.id === 'deadline').status, 'fail');
});

test('unmet mandatory requirement defaults evaluation to No Bid', () => {
  const opportunity = completeOpportunity({ mandatory_requirements: [{ name: 'Certification', status: 'unmet' }] });
  assert.equal(evaluateOpportunity(opportunity, {}, { now }).recommendation, 'No Bid');
});

test('unknown hard gate requires clarification even with a high score', () => {
  const opportunity = completeOpportunity({ terms_status: undefined });
  assert.equal(evaluateOpportunity(opportunity, {}, { now }).recommendation, 'Needs Clarification');
});

test('complete strong opportunity recommends Bid', () => {
  const result = evaluateOpportunity(completeOpportunity(), {}, { now });
  assert.equal(result.recommendation, 'Bid');
  assert.equal(result.scoring.coverage, 100);
});

test('weighted scoring reports missing dimensions and coverage', () => {
  const result = weightedScore({ capability_fit: 5 });
  assert.equal(result.score, 5);
  assert.equal(result.coverage, 25);
  assert.ok(result.missing.includes('strategic_value'));
});

test('unknown budget remains an explicit information gap without fabricating an amount', () => {
  const opportunity = completeOpportunity({ budget: { stated: false, amount: null, currency: 'USD' } });
  const result = evaluateOpportunity(opportunity, {}, { now });
  assert.ok(result.information_gaps.includes('budget'));
  assert.equal(opportunity.budget.amount, null);
});

test('stated fixed budget receives a high reliability tier and checks the firm minimum', () => {
  const opportunity = completeOpportunity({ budget: { stated: true, amount: 75000, currency: 'USD', type: 'not-to-exceed' } });
  const profile = { target_engagements: { minimum_budget: 100000 }, commercial: { currency: 'USD' } };
  const result = evaluateOpportunity(opportunity, profile, { now });
  assert.equal(result.budget_reliability.tier, 'High');
  assert.equal(result.budget_reliability.below_minimum, true);
});
