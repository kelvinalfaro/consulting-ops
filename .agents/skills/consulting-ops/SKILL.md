---
name: consulting-ops
description: Discover, capture, evaluate, draft responses to, and track consulting RFPs using the portable consulting-ops repository.
---

# consulting-ops

Read `AGENTS.md` before acting. Treat the Node commands and YAML/Markdown contracts as authoritative; this skill is only a router.

## Route requests

- setup or onboarding: run `node doctor.mjs --json`, then help create missing user files from examples;
- discover or scan: run `node scan-rfps.mjs` and summarize new pipeline entries and source errors;
- capture: normalize the supplied URL, file, or text using `examples/opportunity.example.yml`, preserving source references and unknowns;
- evaluate: run `node evaluate-rfp.mjs <opportunity-file>` and help resolve unknown gates without inventing facts;
- proposal: run `node generate-proposal-draft.mjs <opportunity-file>`, then complete compliance before narrative;
- status or dashboard: read the RFP tracker and report deadlines, active pursuits, decisions, and outcomes.

Never submit, send, sign, certify, or make binding representations. Human review is required for pricing, legal terms, credentials, signatures, and final submission.
