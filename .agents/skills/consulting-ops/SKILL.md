---
name: consulting-ops
description: Consulting RFP command center for discovery, bid/no-bid evaluation, compliance, proposals, tracking, and pursuit learning.
arguments: mode
user_invocable: true
user-invocable: true
argument-hint: "[RFP URL/file | auto | scan | pipeline | evaluate | proposal | letter | evidence | evidence-add | contact | email | contract | finalist | finalist-plan | finalist-practice | finalist-debrief | apply | submission | export | tracker | agent-inbox | deadlines | followup | research | debrief | patterns | training | service | adjacent | jurisdiction | dashboard | update]"
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
| empty | command center | Run readiness checks, then show the discovery menu below |
| URL/file | auto-pipeline | `npx consulting-ops <source>` |
| onboard | firm onboarding | `npx consulting-ops onboard` |
| scan | opportunity discovery | `npx consulting-ops scan` |
| pipeline | pending inbox | `npx consulting-ops pipeline` |
| capture | preserve source | `npx consulting-ops capture` |
| extract | solicitation extraction | `npx consulting-ops extract` |
| amend | amendment capture/review | `npx consulting-ops amend` |
| evaluate | bid/no-bid | `npx consulting-ops evaluate` |
| proposal | compliance/proposal workspace | `npx consulting-ops proposal` |
| letter | cover letter / LOI workspace | `npx consulting-ops letter` |
| evidence | claim evidence register | `npx consulting-ops evidence` |
| evidence-add | stage firm evidence for approval | `npx consulting-ops evidence-add` |
| contact | procurement contact brief | `npx consulting-ops contact` |
| email | draft procurement email | `npx consulting-ops email` |
| contract | contract issue checklist | `npx consulting-ops contract` |
| finalist | finalist preparation pack | `npx consulting-ops finalist` |
| finalist-plan | timed finalist plan | `npx consulting-ops finalist-plan` |
| finalist-practice | interactive rehearsal | `npx consulting-ops finalist-practice` |
| finalist-debrief | post-finalist debrief | `npx consulting-ops finalist-debrief` |
| apply | supervised portal field preparation | `npx consulting-ops apply` |
| submission | final human-review preparation | `npx consulting-ops submission` |
| export | review-marked PDF/DOCX | `npx consulting-ops export` |
| tracker | pursuit status | `npx consulting-ops tracker` |
| agent-inbox | cross-session request queue | `npx consulting-ops agent-inbox` |
| batch | multiple opportunities | `npx consulting-ops batch` |
| deadlines | deadline/compliance watch | `npx consulting-ops deadlines` |
| followup | pursuit follow-up | `npx consulting-ops followup` |
| research | issuer research | `npx consulting-ops research` |
| debrief | outcome debrief | `npx consulting-ops debrief` |
| patterns | outcome analysis | `npx consulting-ops patterns` |
| training | course/certification assessment | `npx consulting-ops training` |
| service | service-offering assessment | `npx consulting-ops service` |
| adjacent | adjacent target assessment | `npx consulting-ops adjacent` |
| jurisdiction | procurement-market calibration | `npx consulting-ops jurisdiction` |
| dashboard | build dashboard | `npx consulting-ops dashboard` |
| update | safe update | `npx consulting-ops update` |

For auto, evaluate, proposal, pipeline, scan, batch, and amend, read `modes/_shared_rfp.md` plus the relevant mode file. Never invent qualifications, silently accept amendment changes, or submit/send/sign a response.

## Command center (no arguments)

Match the career-ops startup experience. Run `node doctor.mjs --json` and `node update-system.mjs check`, then summarize readiness and show the full consulting-native command center. Do not replace the menu with a short list of common commands.

```text
consulting-ops — Command Center

- Paste an RFP/RFQ URL or file → capture, extract, bid/no-bid report, tracker, and conditional proposal workspace
- scan → discover current consulting opportunities
- pipeline → process sources in data/rfp_pipeline.md
- evaluate → run hard gates and weighted bid/no-bid evaluation
- proposal → build the compliance matrix, outline, and source-grounded response workspace
- letter → draft a source-grounded cover letter or letter of interest
- compare → compare and rank pursuits
- research → prepare issuer and opportunity research
- contact → prepare a procurement contact brief
- email → draft procurement or follow-up correspondence; never sends
- evidence → audit claims, sources, and evidence gaps
- evidence-add → stage a case study, credential, or writing sample for approval
- amend → preserve and assess a solicitation amendment
- submission → prepare the final human-review checklist; never submits
- apply → prepare portal fields and attachments in a supervised flow; always stops before submission
- export → create review-marked PDF and DOCX files
- finalist → prepare for a finalist presentation or interview
- finalist-plan → create a time-blocked preparation plan
- finalist-practice → rehearse interactively, one question at a time
- finalist-debrief → capture questions, commitments, signals, and follow-up
- contract → review contract issues for professional/legal follow-up
- tracker → review pursuit statuses and metrics
- inbox → summarize pending, urgent, and unowned work
- agent-inbox → queue, inspect, and resolve requests between sessions
- deadlines → review deadlines and compliance risks
- followup → review cadence and draft follow-ups
- debrief → record an outcome and lessons learned
- patterns → analyze win/loss/no-bid outcomes and improve targeting
- training → assess a course or certification against firm strategy
- service → assess a consulting service or portfolio-offering idea
- adjacent → identify and test adjacent opportunity targets
- jurisdiction → calibrate eligibility and readiness for a procurement market
- dashboard → build the local pursuit dashboard
- doctor → validate setup
- update → preview and apply system updates

Tell me a mode, or paste an RFP/RFQ URL or file.
```
