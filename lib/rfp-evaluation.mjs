import { assessBudgetReliability } from './budget-reliability.mjs';

const DECISIONS = new Set(['Bid', 'Conditional Bid', 'No Bid', 'Needs Clarification']);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function dateOnly(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function scoreValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 1 && numeric <= 5 ? numeric : null;
}

export const DEFAULT_WEIGHTS = Object.freeze({
  capability_fit: 25,
  client_mission_fit: 15,
  approach_differentiation: 15,
  capacity_feasibility: 15,
  commercial_attractiveness: 15,
  procurement_win_conditions: 10,
  strategic_value: 5,
});

export function evaluateHardGates(opportunity, profile = {}, now = new Date()) {
  const gates = [];
  const due = dateOnly(opportunity?.proposal_due);
  gates.push({
    id: 'deadline',
    status: !due ? 'unknown' : due >= now ? 'pass' : 'fail',
    reason: !due ? 'Proposal deadline is not recorded.' : due >= now ? 'Proposal deadline has not passed.' : 'Proposal deadline has passed.',
  });

  const mandatory = asArray(opportunity?.mandatory_requirements);
  const unmet = mandatory.filter((item) => item?.status === 'unmet');
  const unknown = mandatory.filter((item) => !item?.status || item.status === 'unknown');
  gates.push({
    id: 'eligibility',
    status: unmet.length ? 'fail' : unknown.length ? 'unknown' : 'pass',
    reason: unmet.length
      ? `${unmet.length} mandatory requirement(s) are marked unmet.`
      : unknown.length
        ? `${unknown.length} mandatory requirement(s) still need confirmation.`
        : 'No unmet mandatory requirements are recorded.',
  });

  const capacity = opportunity?.capacity_status ?? profile?.capacity?.status;
  gates.push({
    id: 'capacity',
    status: capacity === 'unavailable' ? 'fail' : capacity === 'available' ? 'pass' : 'unknown',
    reason: capacity === 'unavailable'
      ? 'Delivery capacity is marked unavailable.'
      : capacity === 'available'
        ? 'Delivery capacity is marked available.'
        : 'Delivery capacity has not been confirmed.',
  });

  const terms = opportunity?.terms_status;
  gates.push({
    id: 'terms',
    status: terms === 'unacceptable' ? 'fail' : terms === 'acceptable' ? 'pass' : 'unknown',
    reason: terms === 'unacceptable'
      ? 'Commercial or contractual terms are marked unacceptable.'
      : terms === 'acceptable'
        ? 'Terms are marked acceptable, subject to final human review.'
        : 'Terms have not been reviewed.',
  });

  const scope = opportunity?.scope_status;
  gates.push({
    id: 'professional_scope',
    status: scope === 'outside' ? 'fail' : scope === 'within' ? 'pass' : 'unknown',
    reason: scope === 'outside'
      ? 'The requested work is marked outside the firm’s professional scope.'
      : scope === 'within'
        ? 'The requested work is marked within professional scope.'
        : 'Professional-scope fit has not been confirmed.',
  });
  return gates;
}

export function weightedScore(scores = {}, weights = DEFAULT_WEIGHTS) {
  let numerator = 0;
  let denominator = 0;
  const missing = [];
  for (const [dimension, weight] of Object.entries(weights)) {
    const score = scoreValue(scores[dimension]);
    if (score == null) {
      missing.push(dimension);
      continue;
    }
    numerator += score * weight;
    denominator += weight;
  }
  return {
    score: denominator ? Math.round((numerator / denominator) * 100) / 100 : null,
    coverage: Math.round((denominator / Object.values(weights).reduce((sum, value) => sum + value, 0)) * 100),
    missing,
  };
}

export function recommendDecision(gates, scoreResult) {
  if (gates.some((gate) => gate.status === 'fail')) return 'No Bid';
  if (gates.some((gate) => gate.status === 'unknown')) return 'Needs Clarification';
  if (scoreResult.score == null || scoreResult.coverage < 70) return 'Needs Clarification';
  if (scoreResult.score >= 4) return 'Bid';
  if (scoreResult.score >= 3.25) return 'Conditional Bid';
  return 'No Bid';
}

export function evaluateOpportunity(opportunity, profile = {}, options = {}) {
  const gates = evaluateHardGates(opportunity, profile, options.now ?? new Date());
  const scoring = weightedScore(opportunity?.assessment?.scores, options.weights ?? DEFAULT_WEIGHTS);
  const recommendation = recommendDecision(gates, scoring);
  const budgetReliability = assessBudgetReliability(opportunity?.budget, profile);
  const override = opportunity?.assessment?.decision;
  const informationGaps = [];
  if (!opportunity?.budget?.stated || opportunity?.budget?.amount == null) informationGaps.push('budget');
  if (!opportunity?.submission?.method) informationGaps.push('submission_method');
  if (!asArray(opportunity?.evaluation_criteria).length) informationGaps.push('evaluation_criteria');
  if (override && !DECISIONS.has(override)) throw new Error(`Invalid decision: ${override}`);
  return {
    id: opportunity?.id ?? null,
    title: opportunity?.title ?? null,
    issuer: opportunity?.issuer ?? null,
    source_url: opportunity?.source_url ?? null,
    evaluated_at: (options.now ?? new Date()).toISOString(),
    gates,
    scoring,
    budget_reliability: budgetReliability,
    recommendation,
    decision: override ?? recommendation,
    decision_override: override ? override !== recommendation : false,
    information_gaps: informationGaps,
  };
}

export function renderEvaluationMarkdown(result) {
  const gateRows = result.gates.map((gate) => `| ${gate.id} | ${gate.status} | ${gate.reason} |`).join('\n');
  const missing = result.scoring.missing.length ? result.scoring.missing.join(', ') : 'None';
  return `# RFP evaluation: ${result.issuer ?? 'Unknown issuer'} - ${result.title ?? 'Untitled opportunity'}

**Opportunity ID:** ${result.id ?? 'Unassigned'}
**Source:** ${result.source_url ?? 'Not recorded'}
**Recommendation:** ${result.recommendation}
**Decision:** ${result.decision}${result.decision_override ? ' (human override; document rationale)' : ''}
**Weighted score:** ${result.scoring.score ?? 'Not enough information'}/5
**Score coverage:** ${result.scoring.coverage}%
**Budget reliability:** ${result.budget_reliability.tier} - ${result.budget_reliability.reason}

## Hard gates

| Gate | Status | Evidence |
|---|---|---|
${gateRows}

## Scoring gaps

${missing}

## Procurement information gaps

${result.information_gaps.length ? result.information_gaps.map((gap) => `- ${gap}`).join('\n') : '- None recorded'}

## Commercial boundary

- Stated amount: ${result.budget_reliability.amount == null ? 'Not reliably recorded' : `${result.budget_reliability.currency ?? ''} ${result.budget_reliability.amount}`.trim()}
- Firm minimum: ${result.budget_reliability.minimum_budget == null ? 'Not configured' : `${result.budget_reliability.currency ?? ''} ${result.budget_reliability.minimum_budget}`.trim()}
- Below configured minimum: ${result.budget_reliability.below_minimum == null ? 'Unknown' : result.budget_reliability.below_minimum ? 'Yes - human bid review required' : 'No'}

## Required human review

- Confirm every mandatory requirement against the authoritative RFP and amendments.
- Review pricing, legal terms, certifications, representations, and signatures.
- The system does not submit responses.
`;
}
