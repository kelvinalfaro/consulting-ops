function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function assessBudgetReliability(budget = {}, profile = {}) {
  const amount = number(budget.amount);
  const minimum = number(profile?.target_engagements?.minimum_budget);
  const type = String(budget.type ?? budget.basis ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  let tier = 'Unknown';
  let reason = 'No authoritative budget amount is recorded.';

  if (budget.stated && amount != null && ['fixed', 'firm_fixed', 'not_to_exceed', 'maximum'].includes(type)) {
    tier = 'High';
    reason = `The solicitation states a ${type.replaceAll('_', ' ')} budget amount.`;
  } else if (budget.stated && amount != null) {
    tier = 'Medium';
    reason = 'The solicitation states an amount, but its pricing basis or guaranteed availability is not fully defined.';
  } else if (budget.stated || budget.range || budget.description) {
    tier = 'Low';
    reason = 'Budget language exists, but no reliable comparable amount was extracted.';
  }

  return {
    tier,
    reason,
    amount,
    currency: budget.currency ?? profile?.commercial?.currency ?? null,
    below_minimum: amount != null && minimum != null ? amount < minimum : null,
    minimum_budget: minimum,
  };
}
