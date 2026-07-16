---
name: consulting-concierge
description: Operate Consulting Ops conversationally for RFP and RFQ discovery, bid or no-bid decisions, proposal preparation, pursuit tracking, deadlines, amendments, follow-up, finalist preparation, onboarding, and system updates. Use when the user wants a consulting-business outcome without needing to know CLI commands.
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

## Boundaries

- Preserve every authoritative solicitation and amendment.
- Use only approved workspace evidence for firm claims; record unknowns and gaps instead of guessing.
- Keep pricing, legal terms, certifications, representations, signatures, correspondence, and submission under explicit human review.
- Never perform a final Submit, Send, Sign, Certify, or equivalent action.
- Treat the CLI output and generated files as working artifacts, not evidence of approval.

## Updates

Use `consulting-ops update check` to inspect updates. Explain the result and obtain confirmation before `consulting-ops update apply`. Updates may change the system package but must not change the configured workspace.
