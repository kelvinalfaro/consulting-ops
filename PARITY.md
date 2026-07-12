# career-ops to consulting-ops capability parity

The executable source of truth for user-flow mapping is `FLOW_PARITY.json`. `npm run audit:parity` fails if a career-ops command-center flow lacks a consulting-native command, implementation, mode contract, or automated test file. `npm test` then executes behavior tests, syntax checks, parity and release audits, tracker verification, and a package dry run.

Parity means preserving the operating capability at the same level while translating it to procurement. It does not mean retaining job-search names or forcing concepts such as salary gaps and CV synchronization into an RFP system.

| career-ops capability/scripts | consulting-ops equivalent | Status |
|---|---|---|
| `add-entry`, `tracker`, `set-status`, tracker parse/utils/links | `tracker`, `add`, `status`, `lib/rfp-tracker.mjs`, `lib/tracker-store.mjs` | Implemented |
| `verify-pipeline`, `normalize-statuses`, `dedup-tracker`, `merge-tracker`, `reconcile-pipeline` | `verify`, `normalize`, `dedup`, `reconcile`, atomic tracker store | Implemented |
| `stats`, `find`, `analyze-patterns`, `classify-tier`, `match-star`, `role-matcher` | `stats`, `find`, `patterns`, `evaluate`, `compare` | Implemented |
| `scan`, `scan-ats-full`, portal validation/verification | `scan`, provider registry, RSS/Atom/JSON/web-search/official-HTML/manual providers, boundary-aware filtering, deadline rejection, `plugins audit` | Implemented |
| `browser-extract`, `archive-posting`, `fingerprint-core`, `detect-reposts` | `capture`, `extract`, raw-source preservation, URL deduplication, `amend` | Implemented |
| `check-liveness`, liveness core/API/browser | `liveness` with HEAD/GET fallback and explicit non-checkable state | Implemented |
| `prepare-application`, `application-answers`, `generate-cover-letter` | `proposal`, supervised `apply` field pack, compliance matrix, clarification questions, standalone `letter` | Implemented |
| PDF/LaTeX builders and CV checks | editable Markdown plus review-marked PDF/DOCX `export`; proposal `quality` | Implemented, domain translated |
| `followup-seed`, `followup-cadence`, reply watch/matcher | `followup`, `deadlines`, `inbox`, contact/email drafts | Implemented without automatic email access |
| `agent-inbox` | durable `agent-inbox` add/list/resolve queue; `inbox` remains the pursuit work summary | Implemented |
| `process-quality` | `quality`, compliance matrix, evidence map, review checklist | Implemented |
| `plugins`, `plugin-audit`, `plugin-install`, registry validation | `plugins list|audit|install`, provider loader, private `plugins.local/` | Implemented |
| OpenAI/Gemini/Ollama/OpenRouter evaluator runners | deterministic `evaluate` plus portable agent modes/adapters | Implemented without vendor lock-in |
| `update-system`, updater migration tests | `update check|apply|rollback`, user/system boundary, migration review helper, release audit, package dry run | Implemented |
| career skill modes and CLI adapters | RFP-native modes plus Agents/Codex, Claude, OpenCode, Antigravity, Qwen, Grok, Kimi adapters | Implemented |
| salary analysis, CV sync, ATS matching, interview/offer modes | budget/commercial gate, evidence controls, finalist prep, contract review, submission prep | Implemented, domain translated |

## User-flow mappings added beyond the original lifecycle

Career-ops cover maps to `letter`; apply maps to supervised `apply`; interview plan/practice/debrief map to `finalist-plan`, `finalist-practice`, and `finalist-debrief`; agent-inbox maps directly; training maps directly; project maps to `service`; titles maps to `adjacent`; regional calibration maps to `jurisdiction`; add maps to review-gated `evidence-add`; offer-prep maps to `contract`; PDF and LaTeX map to review-marked PDF and editable DOCX export, respectively. These are domain translations, not aliases that preserve job-search semantics.

## Additional procurement-native capabilities

Consulting-ops also adds amendment capture, mandatory-requirement hard gates, question and intent deadlines, compliance and attachment matrices, source-grounded client research, procurement contact controls, evidence registers, proposal workspaces, debriefs, and explicit human submission safeguards.

The executable audit is `npm run audit:parity`. Tests and packaging checks are separate evidence; this matrix is not a substitute for them.

## Command-center acceptance standard

The no-argument skill flow must match career-ops operationally: run doctor and update checks, report readiness, and display the complete consulting-native command menu. Every advertised command must have a CLI route and mode instructions where agent judgment is required. The parity audit checks this surface across all shipped AI adapters.

Discovery separates actionable opportunities from procurement source leads. Only concrete, domain-relevant solicitations enter `Pending`; portal and directory leads are retained under `Source leads`; informational RFP/RFQ articles are rejected. Pipeline processing is scoped strictly to the `Pending` section.
