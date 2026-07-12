# Data contract

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

Providers return an array of objects with `title`, an HTTP(S) `url`, `issuer`, optional `published` and `summary`, and `source_id`. Scanning filters and de-duplicates URLs before appending unchecked pipeline entries.
