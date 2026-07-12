---
name: consulting-ops
description: Consulting RFP command center for discovery, bid/no-bid evaluation, compliance, proposals, tracking, and pursuit learning.
arguments: mode
user_invocable: true
user-invocable: true
argument-hint: "[RFP URL/file | auto | scan | pipeline | evaluate | proposal | evidence | contact | email | contract | finalist | submission | export | tracker | deadlines | followup | research | debrief | patterns | dashboard | update]"
license: MIT
---

# consulting-ops router

Read `AGENTS.md`. This shared router keeps the same semantics across AI CLIs.

## Invocation

- CLIs with skill registration may expose `/consulting-ops`.
- In Codex or another prompt-driven CLI, ask for the same mode in plain language.
- The deterministic equivalent is `npx consulting-ops <mode>`.
- A URL or file with no subcommand runs the full auto-pipeline.

| Input | Mode | Core command |
|---|---|---|
| empty | discovery menu | `npx consulting-ops help` |
| URL/file | auto-pipeline | `npx consulting-ops <source>` |
| onboard | firm onboarding | `npx consulting-ops onboard` |
| scan | opportunity discovery | `npx consulting-ops scan` |
| pipeline | pending inbox | `npx consulting-ops pipeline` |
| capture | preserve source | `npx consulting-ops capture` |
| extract | solicitation extraction | `npx consulting-ops extract` |
| amend | amendment capture/review | `npx consulting-ops amend` |
| evaluate | bid/no-bid | `npx consulting-ops evaluate` |
| proposal | compliance/proposal workspace | `npx consulting-ops proposal` |
| evidence | claim evidence register | `npx consulting-ops evidence` |
| contact | procurement contact brief | `npx consulting-ops contact` |
| email | draft procurement email | `npx consulting-ops email` |
| contract | contract issue checklist | `npx consulting-ops contract` |
| finalist | finalist preparation pack | `npx consulting-ops finalist` |
| submission | final human-review preparation | `npx consulting-ops submission` |
| export | review-marked PDF/DOCX | `npx consulting-ops export` |
| tracker | pursuit status | `npx consulting-ops tracker` |
| batch | multiple opportunities | `npx consulting-ops batch` |
| deadlines | deadline/compliance watch | `npx consulting-ops deadlines` |
| followup | pursuit follow-up | `npx consulting-ops followup` |
| research | issuer research | `npx consulting-ops research` |
| debrief | outcome debrief | `npx consulting-ops debrief` |
| patterns | outcome analysis | `npx consulting-ops patterns` |
| dashboard | build dashboard | `npx consulting-ops dashboard` |
| update | safe update | `npx consulting-ops update` |

For auto, evaluate, proposal, pipeline, scan, batch, and amend, read `modes/_shared_rfp.md` plus the relevant mode file. Never invent qualifications, silently accept amendment changes, or submit/send/sign a response.
