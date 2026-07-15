# career-ops 1.20.0 parity review

This review compares `career-ops-v1.19.0..career-ops-v1.20.0` and translates only changes that have an honest consulting-procurement equivalent. It is both the parity record for this release and the design guardrail for the next Consulting Ops capability-gap work.

## Release disposition

| career-ops 1.20.0 change | consulting-ops disposition |
|---|---|
| Correct targeted upskill known-skill suppression | Roadmap requirement. Consulting Ops does not yet perform automated keyword-level capability-gap suppression, so there is no defective runtime path to patch. Any future targeted capability-gap analyzer must compare canonical capability sets, use explicit aliases, and never use substring matching that confuses terms such as `go` and `mongodb`. |
| Refuse unvalidated redirects in targeted upskill fallback fetch | Already covered or not applicable. Consulting Ops URL ingestion uses its bounded extraction and provider paths rather than the career upskill fallback. Any future direct capability-gap URL fetch must reject redirects or revalidate every redirect target before following it. |
| Document targeted upskill behavior | Domain-translated here as a roadmap contract for evidence-grounded capability-gap analysis. Existing `training`, `service`, `adjacent`, and `jurisdiction` assessments remain evidence worksheets and do not claim automated gap detection. |
| Add CareerOps Manifesto, signatures, and community automation | Intentionally excluded. These are CareerOps identity and community-governance assets, not portable RFP operating capabilities. Consulting Ops retains its own governance and upstream attribution files. |
| Surface the CareerOps Manifesto after onboarding and updates | Intentionally excluded for the same reason; Consulting Ops onboarding remains focused on firm evidence, scope, and submission safeguards. |
| Add `scan-ats-full.mjs` to the career agent file table | Already represented by the Consulting Ops discovery/provider mapping in `PARITY.md`; no job-board script or naming is imported. |

## Roadmap acceptance criteria

If Consulting Ops later adds automated targeted capability-gap analysis, it must:

1. Extract requirements only from the authoritative solicitation and amendments.
2. Extract known capabilities only from approved firm sources under the `AGENTS.md` source-of-truth boundary.
3. Compare canonical terms or explicit aliases as sets; substring matching is prohibited.
4. Keep unknown requirements visible rather than treating missing evidence as a proven gap or qualification.
5. Refuse redirects in fallback fetches or revalidate every redirect hop against the existing SSRF protections.
6. Include regression fixtures for alias matches, substring collisions, missing evidence, redirect refusal, and source-boundary enforcement.

## Parity conclusion

Career Ops 1.20.0 introduced no directly reusable RFP runtime feature. Consulting Ops is current with the release after recording the capability-gap and redirect-safety requirements above and explicitly excluding career-only manifesto/community behavior. The substantive RFP-native runtime additions remain those mapped from 1.19.0.
