---
name: consulting-ops
description: Legacy compatibility router. Use only when the user explicitly asks for the consulting-ops skill or a raw Consulting Ops CLI command; use consulting-concierge for normal consulting opportunity and proposal work.
arguments: mode
user_invocable: true
user-invocable: true
argument-hint: "[RFP URL/file | scan | pipeline | tracker | evaluate | proposal | apply | letter | finalist | compare | contract | followup | patterns | adjacent | more]"
license: MIT
---

# Consulting Ops legacy router

Prefer the `consulting-concierge` skill. This alias preserves older explicit invocations.

## Invocation

- Empty invocation: run exactly `consulting-ops`.
- `help` or `more`: run `consulting-ops more`.
- A mode: run `consulting-ops <mode> [arguments]`.
- An RFP/RFQ URL or file with no mode: run `consulting-ops <source>`.
- If a command produces no output, treat that as an error to diagnose; do not silently invent a result.

## Context loading

The installed CLI owns workspace resolution and system instructions.

Never invent qualifications, silently accept amendment changes, send correspondence, sign, certify, or submit a response. The user performs final submission.
