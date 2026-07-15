# RFP evaluation mode

Use this mode when the user supplies an RFP, RFQ, RFI, call for consultants, notice of funding, or similar consulting opportunity.

## Inputs

- authoritative solicitation and amendments;
- normalized record based on `examples/opportunity.example.yml`;
- approved firm evidence from the user layer.

If the source is only a URL, capture it without inventing fields. If a PDF or attachment cannot be read, stop the evaluation at `Needs Clarification` and identify the missing source.

## Output

Create a report with:

### A. Opportunity summary

Issuer, title, procurement type, jurisdiction, scope, budget, schedule, contacts, questions deadline, intent deadline, proposal deadline, and submission method.

### B. Compliance and hard gates

List every mandatory requirement with its source and status. Evaluate deadline, eligibility, capacity, terms, and professional-scope gates separately from scoring.

### C. Capability and evidence match

Map each material scope requirement to exact approved firm evidence. Identify gaps, teaming needs, and questions. Do not treat adjacent experience as direct experience.

### D. Approach and differentiation

Outline a credible engagement approach without writing a full proposal. Identify what is genuinely distinctive and supported.

### E. Commercial and delivery feasibility

Assess budget information, its reliability tier, any gap against the configured minimum engagement size, effort drivers, schedule, staffing, travel, dependencies, pricing format, payment terms, and capacity. A stated ceiling is not automatically guaranteed revenue. Pricing recommendations require human review.

### F. Win conditions and risks

Assess incumbent advantage, relationship strength, evaluation criteria, procurement burden, competition, ambiguity, contractual risk, and strategic value.

### G. Decision

Include weighted 1-5 score, score coverage, confidence, recommendation, unresolved conditions, next action, and decision owner. Use `node evaluate-rfp.mjs` for deterministic gates and score math.

### H. Proposal readiness

List required documents, missing evidence, clarification questions, internal owners, and a work-back schedule from the submission deadline.

After evaluation, update the RFP tracker using canonical states. Do not create a proposal workspace unless the user selects Bid/Conditional Bid or explicitly requests one for exploration.
