# career-ops 1.21.0 parity review

This review compares `career-ops-v1.20.0..career-ops-v1.21.0` and carries over only capabilities with a direct consulting-procurement equivalent.

## Release disposition

| career-ops 1.21.0 change | consulting-ops disposition |
|---|---|
| Persist scanner trust score and flags | Ported as explainable discovery classification. Retained and rejected items receive a classification, confidence, and stable reason codes; normal output summarizes rejection reasons while `--include-rejected` exposes item-level details. |
| Track portal health and coverage decay | Ported as private `data/source-health.tsv` history with reachable, empty, network, configuration, and authorization-required states. Three consecutive failures mark a source as persistently failing; a successful or empty response resets the streak. |
| Apply the user blacklist in the full ATS scan | Already covered. Consulting Ops has one provider-neutral scan path and applies the private issuer blacklist after every provider fetch, including local plugins. |
| Quiet dotenv during JSON scan output | Already covered. The Consulting Ops scanner emits parseable JSON and does not load dotenv in its output path. |
| Oracle Recruiting Cloud and Workday ATS additions | Intentionally excluded. These are employment-board integrations, not procurement sources. |
| Repeat-company, interview, compensation, CV, cover-letter, and risk-summary changes | Intentionally excluded. Consulting equivalents remain opportunity deduplication, source-grounded evaluation, proposal evidence checks, and human-reviewed pursuit decisions. |
| CareerOps manifesto, ledger, dashboard, logo, and community changes | Intentionally excluded because they do not provide an RFP operating capability. |

## Additional discovery hardening

The port also fixes a Consulting Ops-specific external-workspace defect: bundled providers now load from the installed system package while private providers load from the configured workspace. Duplicate provider identifiers fail explicitly. Discovery canonicalizes tracking URLs, fingerprints issuer/title/deadline combinations, keeps one authoritative link per procurement table row, and supports source-specific filters.

## Acceptance evidence

- Focused tests cover external-workspace provider loading, provider-ID collisions, classification reasons, canonical and fingerprint deduplication, table-row link selection, dry-run immutability, source-filter overrides, and source-health failure streaks.
- The configured live dry run completes without provider errors and keeps informational results out of `Pending`.
- Full tests, parity, release/privacy, package, diff, and secret-safety gates remain required before handoff.
