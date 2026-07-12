# consulting-ops agent instructions

## Purpose

`consulting-ops` is a local-first, AI-agnostic system for discovering, qualifying, evaluating, drafting responses to, and tracking consulting and coaching opportunities such as RFPs, RFQs, RFIs, notices of funding, calls for consultants, and invitations to bid.

The core is ordinary Node.js, YAML, and Markdown. AI-specific skills or plugins are optional adapters and must not become required for core operations.

## Current migration status

This repository began as a copy of `santifer/career-ops` and is being converted domain by domain. Treat career-specific commands, files, tests, and documentation as inherited code, not as valid consulting-ops behavior, unless they have been explicitly adapted and tested.

Follow `implementation_plan.md`. Do not claim a phase is complete because files were renamed.

## Source-of-truth boundary

Generated client-facing content may use only:

- `capability_statement.md`;
- `config/company_profile.yml`;
- `case-studies/`;
- `team/`;
- `writing-samples/`;
- `voice-dna.md` for style only;
- `modes/_company_profile.md` and `modes/_custom.md` for user rules and framing;
- the authoritative RFP and amendments stored or referenced for the current opportunity;
- facts the user supplies in the current conversation.

Do not use AI memory, sibling folders, unrelated repositories, or general inference as evidence for qualifications, clients, outcomes, certifications, availability, or pricing. Reframe supported facts; never fabricate or inflate them.

## User and system layers

User-owned files must never be overwritten by updates:

- `capability_statement.md`
- `config/company_profile.yml`
- `case-studies/`
- `team/`
- `writing-samples/`
- `data/`, `reports/`, and `proposals/`
- `modes/_company_profile.md` and `modes/_custom.md`

System files include scripts, shared modes, neutral templates, dashboard code, providers, tests, and AI adapters. Public examples must be fictional or clearly licensed.

## Operating rules

1. Run `node doctor.mjs --json` before a workflow and resolve missing prerequisites through onboarding.
2. Preserve the original solicitation and every amendment. Normalized fields are working data, not replacements for source documents.
3. Check deadline, eligibility, mandatory requirements, submission method, required attachments, page limits, and evaluation criteria before drafting.
4. Separate hard gates from weighted fit scoring.
5. Cite the source for every material requirement and every firm claim used in a response.
6. Put unknown information in a questions or gaps list. Do not guess.
7. Generate a compliance matrix and response outline before full proposal prose.
8. Treat pricing, contractual terms, certifications, representations, signatures, and final submission as human-review items.
9. Never click or invoke a final Submit, Send, or Apply action. The user performs final submission.
10. Track amendments, clarifications, and outcome changes without destroying prior records.

## Canonical lifecycle

Use only the states defined by the RFP state schema. The intended lifecycle is:

`Discovered -> Qualified -> Evaluated -> Bid -> Drafting -> Review -> Submitted -> Shortlisted -> Won | Lost`

Terminal alternatives are `No Bid`, `Withdrawn`, `Cancelled`, `Expired`, and `Duplicate`.

## Cross-AI behavior

- `AGENTS.md` is the portable baseline.
- Vendor files such as `CLAUDE.md`, `CODEX.md`, and skills should be thin adapters to this contract.
- Never make a vendor-only tool the sole way to scan, evaluate, generate, or track.
- When a capability is unavailable, provide a deterministic core command or a documented manual fallback.

## Privacy and publication

This working copy contains Alfaro Consulting material. Before initializing or publishing a public repository:

- replace private user files with templates or examples;
- scan tracked content for personal data, client-confidential details, credentials, secrets, and proprietary source documents;
- preserve upstream MIT licensing and attribution;
- confirm the destination GitHub account and repository visibility with the user;
- show the exact publication inventory before the first push.

## Validation

Run focused tests for every modified component. Before a release, run the RFP-native full suite, a clean-install smoke test, a private-data scan, and one end-to-end fixture workflow from capture to proposal workspace. Do not use the inherited career test count as release evidence.
