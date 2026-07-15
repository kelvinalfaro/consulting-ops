# career-ops 1.19.0 port

This port translates upstream capabilities into consulting procurement. It does not copy job-search behavior where there is no honest RFP equivalent.

## Implemented equivalents

| career-ops 1.19.0 capability | consulting-ops equivalent |
|---|---|
| Compensation reliability tiers | Solicitation budget-reliability tier and configured minimum-budget check |
| Configurable JD extraction cap | `extract-rfp.mjs --max-chars`, while preserving the complete authoritative `source.txt` |
| Funnel calibration | RFP pursuit funnel from discovered through bid, submitted, shortlisted, and won |
| CV fact validator | Proposal metric-claim validator against approved firm evidence |
| Do-not-apply list | Private `data/blacklist.md` issuer exclusions |
| Posting-age gate and persisted dates | Optional `max_posting_age_days`; feed `published` evidence remains in the pipeline |
| Deterministic personalization | Ollama loads `company_profile.yml`, `_company_profile.md`, and `_custom.md` explicitly |
| Local model routing | RFP-native `ollama-eval.mjs` using Ollama `/api/chat`, Qwen, loopback privacy controls, full-output validation, and local summary repair |
| Thin agent wrappers | Existing adapters delegate to the canonical `.agents` skill |

## Already present

RFP-native equivalents already covered liveness uncertainty, source-relative report links, duplicate opportunity IDs, tracker normalization, compliance-first proposal quality, manual correspondence drafting, outcome learning, provider plugins, and user/system update boundaries.

## Intentionally not ported

CV/ATS/LaTeX tailoring, interview-invite matching, salary-market features, job-board providers, and job-market language packs are employment-search features. Consulting-ops retains proposal export, finalist preparation, procurement correspondence, and RFP providers instead.
