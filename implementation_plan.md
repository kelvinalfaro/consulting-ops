# consulting-ops implementation plan

## Product decision

`consulting-ops` will be an AI-agnostic, local-first Node.js and Markdown application. It will not require a Codex, Claude, or other vendor-specific plugin to work. Agent skills, slash commands, and plugins may be distributed as optional adapters that call the same scripts and read the same data contract.

The first public release will focus on the complete RFP lifecycle:

1. onboard a consulting firm;
2. discover public opportunities;
3. capture and normalize an RFP;
4. evaluate fit, feasibility, compliance, and pursuit value;
5. make an explicit bid/no-bid decision;
6. create a source-grounded proposal workspace and draft;
7. track submission, follow-up, and outcome;
8. learn from wins, losses, and declined opportunities.

The reusable architecture of `career-ops` is valuable, but consulting procurement is not a search-and-replace version of hiring. The RFP domain needs its own data model, states, scoring, artifacts, and safeguards.

## Non-negotiable design principles

- **Cross-AI core:** deterministic scripts and documented Markdown/YAML contracts work without a specific AI vendor.
- **User-owned evidence:** generated claims may come only from the firm's approved profile, capability statement, case studies, personnel bios, writing samples, and facts supplied in the current conversation.
- **Draft, never submit:** the system may prepare files and browser forms but must stop before submission.
- **Compliance before persuasion:** mandatory requirements, attachments, page limits, forms, signatures, and deadlines are tracked separately from narrative quality.
- **Bid discipline:** a high capability match does not override a missed deadline, mandatory certification, impossible capacity, unacceptable terms, or poor economics.
- **Portable personalization:** personal and firm data live in the user layer and remain excluded from the public template repository.
- **Respect the upstream project:** retain MIT attribution and document which architecture originated in `santifer/career-ops`.

## Architecture

### System layer (public and updateable)

- CLI scripts and shared libraries
- neutral examples and templates
- RFP evaluation and proposal modes
- dashboard source
- provider adapters
- tests, schemas, documentation, and AI-agent adapters

### User layer (private and never overwritten)

- `config/company_profile.yml`
- `capability_statement.md`
- `case-studies/`
- `team/`
- `writing-samples/`
- `data/rfp_pipeline.md`
- `data/rfp_tracker.md`
- `data/opportunities/`
- `proposals/`
- `reports/`
- `modes/_company_profile.md` and `modes/_custom.md`

The public repository will ship `.example` or `.template` versions of firm-specific files. Kelvin's Alfaro Consulting content must not be committed to the public template repository unless he explicitly chooses particular material for publication.

## Canonical opportunity model

Each normalized opportunity should support these fields:

```yaml
id: RFP-0001
title: null
issuer: null
source_url: null
source_type: procurement_portal
jurisdiction: null
posted_date: null
questions_due: null
intent_to_bid_due: null
proposal_due: null
anticipated_start: null
budget:
  stated: false
  amount: null
  currency: USD
submission:
  method: null
  portal: null
  contact: null
mandatory_requirements: []
required_attachments: []
evaluation_criteria: []
scope_summary: null
status: discovered
```

Raw source documents remain attached or linked; normalized fields never replace the authoritative RFP.

## Canonical lifecycle states

`Discovered -> Qualified -> Evaluated -> Bid -> Drafting -> Review -> Submitted -> Shortlisted -> Won | Lost`

Terminal alternatives: `No Bid`, `Withdrawn`, `Cancelled`, `Expired`, and `Duplicate`.

## Bid/no-bid evaluation

The evaluation report will keep scores and gates distinct.

### Hard gates

- deadline and submission channel are usable;
- mandatory eligibility and certifications can be met;
- conflicts and terms are acceptable or reviewable;
- delivery capacity exists in the required period;
- the requested work is within ethical and professional scope.

Any failed hard gate defaults to **No Bid** unless the report identifies a concrete clarification or teaming path.

### Weighted dimensions

- capability and past-performance fit: 25%;
- client/mission and relationship fit: 15%;
- approach and differentiation: 15%;
- capacity and delivery feasibility: 15%;
- commercial attractiveness: 15%;
- procurement competitiveness and win conditions: 10%;
- strategic value: 5%.

The report provides a 1-5 fit score, confidence level, evidence gaps, and one of: `Bid`, `Conditional Bid`, `No Bid`, or `Needs Clarification`.

## Delivery phases

### Phase 0 - Repository and licensing baseline

- [x] Preserve the original MIT license and add an upstream attribution notice.
- [x] Initialize a clean Git repository only after generated/private files are excluded.
- [x] Replace package metadata, URLs, keywords, maintainer information, and release configuration.
- [x] Document the fork/rewrite boundary and public/private data boundary.

**Exit:** no public metadata claims this is `career-ops`, and a dry-run file inventory contains no Alfaro-private content.

### Phase 1 - RFP-native contract and onboarding

- [x] Replace governing `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, and other adapters with consulting-ops instructions.
- [x] Define schemas and examples for firm profile, capability statement, case studies, team bios, opportunity records, and tracker states.
- [x] Rewrite `doctor.mjs` to check consulting prerequisites and create only safe files from templates.
- [ ] Add a migration helper for an existing partial `career-ops` copy.

**Exit:** a new user can onboard without a CV, salary target, job portal, or interview file.

### Phase 2 - Opportunity capture and discovery

- [x] Implement URL/file/manual capture into a normalized opportunity record.
- [x] Refactor `scan-rfps.mjs` around pluggable providers rather than an assumed AI `WebSearch` tool.
- [x] Ship initial provider types: RSS/Atom, configurable JSON APIs, and manual inbox import.
- [x] Support PDF, DOCX, HTML, text, and Markdown sources; URL deduplication and deadline extraction.
- [x] Keep jurisdiction-specific portals in configuration, not hardcoded firm logic.

**Exit:** discovery writes auditable pipeline records with source URL, issuer, title, deadline, and raw-source reference.

### Phase 3 - Evaluation and bid/no-bid

- [x] Replace job-fit modes with RFP instructions and machine-readable report summaries.
- [x] Implement hard-gate checks, weighted scoring, missing information, and clarification requirements.
- [x] Replace the application tracker utilities with RFP lifecycle states and fields.
- [ ] Add further tests for duplicate solicitations, amendments, and unknown budgets. Overdue and mandatory-requirement cases are covered.

**Exit:** one command can evaluate a captured RFP and register an evidence-backed decision.

### Phase 4 - Proposal workspace and documents

- [x] Build a compliance matrix before drafting narrative.
- [x] Generate a proposal workspace containing source references, requirements, questions, drafts, and review checklists.
- [x] Generate sections only from approved sources, with evidence references retained for review.
- [x] Support cover letter/LOI, executive summary, approach, work plan, team, past performance, pricing assumptions, and attachments checklist.
- [x] Export review-marked PDF and DOCX while retaining editable Markdown.
- [x] Require human review for pricing, legal terms, representations, signatures, and submission.

**Exit:** a qualified RFP produces a complete reviewable draft package without fabricated qualifications or automatic submission.

### Phase 5 - Dashboard and learning loop

- [x] Replace the inherited dashboard with an RFP tracker view and initial total, active, submitted, won, win-rate, and deadline metrics.
- [x] Add deadline reporting and compliance-first proposal views.
- [x] Capture debriefs and outcome patterns without silently changing source claims.

**Exit:** the dashboard reads only the RFP contract and the repository can learn from outcomes safely.

### Phase 6 - Cross-AI adapters and public release

- [x] Keep `AGENTS.md` as the portable baseline.
- [x] Provide thin Claude, Codex, OpenCode, and Kimi adapters plus a standard shared skill; add others only where useful.
- [x] Make all adapter commands map to documented core CLI operations.
- [x] Replace inherited career-specific tests and CI with RFP-native coverage.
- [x] Add install, quick-start, privacy, security, contribution, and attribution documentation.
- [x] Validate a clean-room package install on Windows and add Windows/macOS/Linux CI across Node 18 and 22; ship portable adapters for multiple AI coding tools.

**Exit:** a new user can clone the repository and complete the sample RFP workflow without Kelvin's data or a particular AI subscription.

## MVP command surface

```text
npm run doctor
npm run onboard
npm run capture -- <URL-or-file>
npm run scan
npm run evaluate -- <opportunity-id>
npm run proposal -- <opportunity-id>
npm run tracker -- list
npm run dashboard
npm test
```

AI users may ask their agent to run the same operations in plain language. Vendor-specific slash commands are conveniences, not the product API.

## Validation strategy

- unit tests for parsing, normalization, state transitions, scoring math, and source boundaries;
- fixture RFPs representing government, nonprofit, higher education, coaching, facilitation, and organizational-development opportunities;
- integration test from capture through proposal workspace creation;
- snapshot checks for dashboard and exported documents;
- secret/private-data scan before every public release;
- manual review against at least one real, expired RFP before live use;
- explicit confirmation that no command submits a response.

## Deferred beyond MVP

- paid tender-database integrations;
- email/calendar connectors;
- CRM integrations;
- consortium/subcontractor matching;
- automated pricing recommendations;
- direct portal form filling;
- multilingual procurement packs.

These can become optional plugins or providers after the core contract is stable.
