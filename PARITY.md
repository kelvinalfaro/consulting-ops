# career-ops to consulting-ops capability parity

Parity means preserving the operating capability at the same level while translating it to procurement. It does not mean retaining job-search names or forcing concepts such as salary gaps and CV synchronization into an RFP system.

| career-ops capability/scripts | consulting-ops equivalent | Status |
|---|---|---|
| `add-entry`, `tracker`, `set-status`, tracker parse/utils/links | `tracker`, `add`, `status`, `lib/rfp-tracker.mjs`, `lib/tracker-store.mjs` | Implemented |
| `verify-pipeline`, `normalize-statuses`, `dedup-tracker`, `merge-tracker`, `reconcile-pipeline` | `verify`, `normalize`, `dedup`, `reconcile`, atomic tracker store | Implemented |
| `stats`, `find`, `analyze-patterns`, `classify-tier`, `match-star`, `role-matcher` | `stats`, `find`, `patterns`, `evaluate`, `compare` | Implemented |
| `scan`, `scan-ats-full`, portal validation/verification | `scan`, provider registry, RSS/Atom/JSON/web-search/manual providers, `plugins audit` | Implemented |
| `browser-extract`, `archive-posting`, `fingerprint-core`, `detect-reposts` | `capture`, `extract`, raw-source preservation, URL deduplication, `amend` | Implemented |
| `check-liveness`, liveness core/API/browser | `liveness` with HEAD/GET fallback and explicit non-checkable state | Implemented |
| `prepare-application`, `application-answers`, `generate-cover-letter` | `proposal`, compliance matrix, clarification questions, cover-letter section | Implemented |
| PDF/LaTeX builders and CV checks | editable Markdown plus review-marked PDF/DOCX `export`; proposal `quality` | Implemented, domain translated |
| `followup-seed`, `followup-cadence`, reply watch/matcher | `followup`, `deadlines`, `inbox`, contact/email drafts | Implemented without automatic email access |
| `agent-inbox` | `inbox` summary of pending, urgent, and unowned pursuit work | Implemented |
| `process-quality` | `quality`, compliance matrix, evidence map, review checklist | Implemented |
| `plugins`, `plugin-audit`, `plugin-install`, registry validation | `plugins list|audit|install`, provider loader, private `plugins.local/` | Implemented |
| OpenAI/Gemini/Ollama/OpenRouter evaluator runners | deterministic `evaluate` plus portable agent modes/adapters | Implemented without vendor lock-in |
| `update-system`, updater migration tests | `update check|apply|rollback`, user/system boundary, package clean-install checks | Implemented |
| career skill modes and CLI adapters | RFP-native modes plus Agents/Codex, Claude, OpenCode, Antigravity, Qwen, Grok, Kimi adapters | Implemented |
| salary analysis, CV sync, ATS matching, interview/offer modes | budget/commercial gate, evidence controls, finalist prep, contract review, submission prep | Implemented, domain translated |

## Additional procurement-native capabilities

Consulting-ops also adds amendment capture, mandatory-requirement hard gates, question and intent deadlines, compliance and attachment matrices, source-grounded client research, procurement contact controls, evidence registers, proposal workspaces, debriefs, and explicit human submission safeguards.

The executable audit is `npm run audit:parity`. Tests and packaging checks are separate evidence; this matrix is not a substitute for them.
