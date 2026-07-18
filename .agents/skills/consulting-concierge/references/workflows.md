# Workflow routing

- Find opportunities: `consulting-ops scan`
- Process saved leads: `consulting-ops pipeline`
- Capture and assess a URL or file: `consulting-ops <source>`
- Decide whether to bid: `consulting-ops evaluate <opportunity-record>`
- Prepare a compliant proposal workspace: `consulting-ops proposal <opportunity-record>`
- Review pursuit portfolio: `consulting-ops tracker`
- Check deadlines and follow-ups: `consulting-ops deadlines` and `consulting-ops followup`
- Preserve an amendment: `consulting-ops amend <record> <amendment>`
- Prepare for a finalist event: `consulting-ops finalist <opportunity-record>`
- Prepare submission fields without submitting: `consulting-ops apply <proposal-workspace>`
- Inspect setup: `consulting-ops doctor --json`

## Routes beyond the pursuit engine

- Initial inquiry and discovery: `consulting-engagement-design`.
- Proposal or SOW drafting and review: `consulting-proposal-sow`.
- Accepted agreement and pre-launch readiness: follow `engagement-intake.md`.
- Active engagement, reset, handoff, or closeout: `consulting-engagement-stewardship`.
- One general-purpose CSV: `csv-data-summarizer`.
- Multiple financial statements, budgets, management reports, or readable financial PDFs: private `analyze-financial-performance`, when installed.
- ROI, NPV, investment justification, option economics, or sensitivity analysis: `consulting-business-case`; it may use completed financial-analysis outputs as evidence.
- Client requests, sponsor updates, or other direct outward-facing drafts: `direct-communication-memo`.

Read the command's generated source references and unresolved-item lists before interpreting results. Use `consulting-ops more` only when no concise route fits.

## Opportunity lifecycle and next-step suggestions

Use the current status and artifacts to suggest only the next useful actions:

1. **Find:** Scan for opportunities or process saved leads.
2. **Capture:** Preserve the authoritative solicitation and normalize its requirements.
3. **Evaluate:** Check hard gates, evidence fit, commercial conditions, and bid recommendation.
4. **Decide:** Ask the user for `Bid`, `Conditional Bid`, `No Bid`, or clarification.
5. **Pursue:** Create `proposals/<opportunity-id>/`, copy the RFP and amendments into its `source/` folder, and update the tracker.
6. **Clarify:** Resolve budget, scope, schedule, terms, references, and other material unknowns before pricing.
7. **Draft:** Complete the compliance matrix, evidence map, response outline, work plan, team, past performance, pricing assumptions, attachments, executive summary, and cover letter.
8. **Review:** Verify requirements, claims, pricing, legal terms, attachments, and final files.
9. **Prepare submission:** Build the submission field pack or final email without sending; the user submits.
10. **Follow through:** Record submission, plan follow-up, prepare for finalist stages, and track the outcome.
11. **Learn or launch:** On `Won`, complete contracting and route the accepted agreement to engagement intake; on `Lost`, `Withdrawn`, or `No Bid`, record the reason and debrief useful patterns.

At task completion, recommend the earliest incomplete stage that materially advances the opportunity. Mention deadline-sensitive work first and distinguish actions the concierge can prepare from approvals or external actions the user must perform.
