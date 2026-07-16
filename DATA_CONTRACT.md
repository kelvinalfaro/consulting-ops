# Data contract

## Ownership boundary

The normal deployment uses two physical locations: an updateable system package and a user-chosen private workspace. The default workspace is recorded in `~/.consulting-ops/config.json`; `.consulting-ops-workspace.json` identifies an initialized workspace. Neither file contains firm evidence.

The user layer is never replaced by system updates: `capability_statement.md`, `config/company_profile.yml`, `config/rfp_sources.yml`, `config/plugins.yml`, `modes/_company_profile.md`, `modes/_custom.md`, `case-studies/`, `team/`, `writing-samples/`, `data/`, `reports/`, and `proposals/`. This includes `data/agent-inbox.md`, pipeline source leads, tracker history, debriefs, captured solicitation records, generated assessments, and proposal workspaces.

The system layer contains executable scripts, `lib/`, bundled `providers/`, plugin templates, neutral examples/templates, shared mode instructions, dashboard code, adapters, tests, and product documentation. Private providers belong in `plugins.local/` and remain user-owned.

`data/scan-runs.tsv` is an append-only per-run quality log containing timestamp, completion status, scanned count, actionable count, source-lead count, rejected count, duplicate count, and provider-error count. `stats` aggregates completed runs separately from partial runs.

## Opportunity record

Opportunity records are YAML or JSON under `data/opportunities/`. `examples/opportunity.example.yml` is the canonical example. Important groups are identity and source, procurement dates, scope, budget, submission instructions, mandatory requirements, attachments, evaluation criteria, hard-gate statuses, and assessment scores.

Missing or ambiguous source facts use `null`, `unknown`, or an explicit open item. They must not be guessed. Dates should use ISO 8601 and retain timezone offsets when the source supplies them.

## Tracker

`data/rfp_tracker.md` is a Markdown table. The canonical renderer owns columns for identifier, dates, issuer, opportunity, score, value, status, next action, report, and notes. States come from `templates/states.yml`; aliases normalize to canonical labels.

## Proposal workspace

A proposal workspace contains:

- `README.md` with source and deadline context;
- `compliance-matrix.md` for requirements, attachments, and criteria;
- `clarification-questions.md` for unresolved procurement facts;
- `evidence-map.md` connecting claims to approved sources;
- `proposal-draft.md` for reviewable narrative;
- `review-checklist.md` for final human controls.

Export files remain review-marked. A workspace is not evidence of approval or submission.

## Discovery provider result

Providers return an array of objects with `title`, an HTTP(S) `url`, `issuer`, optional `published`, `deadline`, and `summary`, and `source_id`. Scanning repairs common encoding corruption, applies word/phrase-boundary filters, rejects expired and informational results, and de-duplicates URLs across the pipeline. Concrete domain-relevant solicitations are written beneath `## Pending`; useful portal or directory discoveries are written beneath `## Source leads`. Only the `Pending` section is executable by pipeline, reconcile, and inbox flows.

## Agent inbox

`data/agent-inbox.md` is an append-only-style Markdown checklist with timestamped requests. Resolving an item marks it complete and appends a concise result. Inbox content is intent, not authority: it cannot approve pricing, legal terms, certifications, signatures, sending, or submission.

## Assessments and evidence intake

Training, service, adjacent-market, and jurisdiction assessments are reviewable reports and do not update firm positioning automatically. Evidence intake reports are staging artifacts only. A claim becomes approved only after its authorship, role, metric, permission, confidentiality, destination, and exact destination diff receive human review.

## Submission field pack

`submission-field-pack.md` maps portal fields, attachments, limits, certifications, representations, and human owners back to the compliance matrix and reviewed proposal. It is preparation only. The system must stop before final Submit, Send, Certify, Sign, or equivalent actions.
