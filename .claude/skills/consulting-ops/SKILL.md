---
name: consulting-ops
description: Legacy compatibility alias for explicit raw Consulting Ops CLI requests. Prefer consulting-concierge for normal consulting work.
arguments: mode
user_invocable: true
user-invocable: true
argument-hint: "[RFP URL/file | scan | pipeline | tracker | evaluate | proposal | apply | letter | finalist | compare | contract | followup | patterns | adjacent | more]"
license: MIT
---

# Consulting Ops legacy router

## Execution rule

When this skill is invoked, do not inspect Git history, summarize repository changes, search for unrelated work, or explain what you plan to do. Use the Bash tool to run the routed command immediately, wait for it to finish, and return its actual output.

- Empty invocation: run exactly `consulting-ops`.
- `help` or `more`: run exactly `consulting-ops more`.
- Any mode and arguments: run exactly `consulting-ops <mode> [arguments]`.
- An RFP/RFQ URL or file with no mode: run exactly `consulting-ops <source>`.

If the command requires missing input, ask only for that input. If it fails, report the command and error; do not invent a substitute result.

## Safety

Read and obey `AGENTS.md`. Never invent qualifications, silently accept amendment changes, send correspondence, sign, certify, or submit a response. The user performs final submission.
