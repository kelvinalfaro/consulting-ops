# Adjacent opportunity targeting

Broaden discovery without turning aspiration into a capability claim.

## Evidence base

Require the capability statement, company profile, custom/profile modes, case studies, team evidence, current search configuration, tracker outcomes, and debrief patterns. Hard-stop if core firm evidence or targeting constraints are missing.

Use `npx consulting-ops adjacent <market-or-service-family>` to create the assessment. Develop three categories:

- **Close adjacency:** already supported by direct evidence, with a different buyer label or procurement category.
- **Stretch adjacency:** plausible with a named evidence or teaming gap.
- **Experimental pivot:** strategically interesting but requiring a bounded market test before targeting.

For every suggestion, provide approved evidence, buyer/market rationale, gap note, likely procurement language, noisy-keyword warning, and the smallest validation step. Never invent experience or imply qualification.

## Configuration gate

Derive search keywords, not raw service titles. Check case-insensitive word/phrase-boundary overlap with existing terms and warn about broad terms. Show the exact YAML diff to `config/rfp_sources.yml` before writing. Never write without explicit user confirmation. Any company-profile positioning change requires its own separate diff and separate confirmation; do not bundle it with search configuration.

After an approved write, suggest a dry-run scan and compare new actionable, source-lead, rejected, duplicate, and error counts against the prior run.
