---
name: consulting-concierge
description: Operate Consulting Ops conversationally across consulting inquiry, RFP or RFQ pursuit, proposal preparation, contracted-engagement intake, pursuit tracking, deadlines, amendments, follow-up, finalist preparation, system onboarding, and updates. Use when the user wants a consulting-business outcome without needing to know CLI commands.
license: MIT
---

# Consulting Concierge

Use the installed `consulting-ops` command as the deterministic engine. The configured private workspace is the source of truth for firm evidence, solicitations, pursuits, reports, and proposals. The package installation is replaceable system code.

## Start

1. Run `consulting-ops doctor --json`.
2. If the command is unavailable, tell the user to install Consulting Ops and run `consulting-ops setup`.
3. If onboarding is incomplete, read `references/onboarding.md` and run `consulting-ops setup` before other work.
4. Infer the requested outcome and use the smallest matching workflow in `references/workflows.md`. Do not expose the complete command catalog unless asked.

The CLI resolves its workspace in this order: `--workspace`, `CONSULTING_OPS_WORKSPACE`, saved user configuration, then the current directory. Do not copy private workspace content into the package or skill directory.

## Consulting lifecycle routing

Route by the work's actual stage rather than treating every request as a pursuit. Specialized skills are optional enhancements, not installation dependencies. When a named skill is unavailable, use the bundled fallback in `references/standalone-workflows.md` and continue without implying that the missing skill is installed.

1. Initial inquiry, sponsor discovery, or an engagement that is still being shaped: use `consulting-engagement-design` when installed; otherwise use the inquiry-shaping fallback.
2. RFP or RFQ discovery, evaluation, pursuit, or tracking: use Consulting Ops and this concierge.
3. A proposal tied to a solicitation: use `consulting-ops proposal <record>`. For a standalone proposal or SOW, use `consulting-proposal-sow` when installed; otherwise use the bundled SOW fallback.
4. An accepted agreement before launch: use the engagement-intake workflow in `references/engagement-intake.md`.
5. An active engagement, reset, handoff, or closeout: use `consulting-engagement-stewardship` when installed; otherwise use the stewardship fallback.
6. Financial, business-case, CSV, or direct-communication work outside the RFP engine: use an applicable installed skill when available; otherwise follow the bounded handoffs in the standalone fallback and state what the core cannot do deterministically.

Keep three forms of intake distinct:

- **System onboarding** configures Consulting Ops and its private workspace.
- **Engagement intake** establishes a contracted project's charter, evidence, access, roles, gaps, and readiness for kickoff.
- **Financial-analysis intake** inspects and maps supplied financial records without changing them.

## Boundaries

- Preserve every authoritative solicitation and amendment.
- Use only approved workspace evidence for firm claims; record unknowns and gaps instead of guessing.
- Keep pricing, legal terms, certifications, representations, signatures, correspondence, and submission under explicit human review.
- Prepare drafts and submission materials, but the user personally performs every outward-facing or commitment action, including sending messages, submitting or uploading final responses, signing, certifying, and publishing. Never perform those actions even when a connected tool can.
- Treat the CLI output and generated files as working artifacts, not evidence of approval.

## Pursuit workspace

When the user chooses `Bid` or `Conditional Bid`, create the proposal workspace and place an unchanged copy of the authoritative RFP inside it. Use `proposals/<opportunity-id>/source/` for the solicitation and every amendment. Preserve original filenames and formats when available; for a web-only solicitation, preserve the captured HTML or PDF and retain the source URL in the proposal README. Copy the source—do not move or replace the record under `data/opportunities/`. Verify that the proposal workspace contains a readable source copy before beginning proposal drafting.

## Completion handoff

After completing a task, state the outcome and suggest the next one to three useful actions from the opportunity lifecycle in `references/workflows.md`. Lead with the recommended next step, adapt suggestions to the current status, deadline, unresolved conditions, and existing artifacts, and omit steps already completed. Do not automatically perform a new material stage merely because it is next.

## Updates

Use `consulting-ops update check` to inspect updates. Explain the result and obtain confirmation before `consulting-ops update apply`. Updates may change the system package but must not change the configured workspace.
