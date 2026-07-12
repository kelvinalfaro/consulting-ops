---
name: consulting-ops
description: Consulting RFP command center. For an empty invocation, load this skill and run `node consulting-ops.mjs` in the first tool batch; return its output without separate doctor/update calls or intermediate interpretation.
arguments: mode
user_invocable: true
user-invocable: true
argument-hint: "[RFP URL/file | scan | pipeline | tracker | evaluate | proposal | apply | letter | finalist | compare | contract | followup | patterns | adjacent | more]"
license: MIT
---

# consulting-ops router

Read `AGENTS.md`. Use the repository's direct Node router; do not invoke a package resolver from a source checkout.

## Invocation

- Empty invocation: run exactly `node consulting-ops.mjs`, then return its command-center output without running doctor or update separately.
- `help` or `more`: run `node consulting-ops.mjs more`.
- A mode: after the readiness check required by `AGENTS.md`, run `node consulting-ops.mjs <mode> [arguments]`.
- An RFP/RFQ URL or file with no mode: run `node consulting-ops.mjs <source>` for the auto-pipeline.
- If a command produces no output, treat that as an error to diagnose; do not silently invent a result.

## Context loading

For auto-pipeline, evaluate, proposal, pipeline, scan, batch, and amend, read `modes/_shared_rfp.md` plus the relevant mode file. For other modes, read the matching mode file when agent judgment is required.

Never invent qualifications, silently accept amendment changes, send correspondence, sign, certify, or submit a response. The user performs final submission.
