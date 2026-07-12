# consulting-ops

Local-first, AI-agnostic operations for finding consulting opportunities, making disciplined bid/no-bid decisions, and preparing reviewable RFP responses.

`consulting-ops` is a domain rewrite inspired by [`santifer/career-ops`](https://github.com/santifer/career-ops). It keeps the useful idea of a portable Markdown pipeline while replacing job applications, CV tailoring, salary analysis, and interviews with RFP discovery, compliance, proposal development, and pursuit tracking. See [UPSTREAM.md](UPSTREAM.md).

## Why it is not tied to one AI

The product interface is a set of Node.js commands plus YAML and Markdown files. You can use it directly, with any AI coding assistant that can read a repository, or with optional agent skills. `AGENTS.md` is the portable instruction baseline; vendor-specific files are thin adapters.

No command submits a proposal. Pricing, legal terms, representations, signatures, and final submission always require human review.

## Current status

This repository is an early public release (`0.1.0`). The RFP-native core includes:

- firm onboarding checks;
- configurable manual, RSS/Atom, and JSON discovery sources;
- a normalized opportunity schema;
- explicit hard gates plus weighted bid/no-bid scoring;
- source-grounded evaluation reports;
- proposal workspaces with compliance matrices, clarification questions, drafts, and review checklists;
- private user-layer boundaries suitable for a reusable public repository;
- a generated read-only HTML pipeline dashboard.

The initial release is intentionally smaller than the upstream project. PDF/DOCX export, paid tender-database integrations, email/calendar connectors, and richer procurement providers remain on the roadmap.

## Quick start

```powershell
git clone https://github.com/kelvinalfaro/consulting-ops.git
cd consulting-ops
npm install
Copy-Item capability_statement.example.md capability_statement.md
Copy-Item config/company_profile.example.yml config/company_profile.yml
Copy-Item config/rfp_sources.example.yml config/rfp_sources.yml
Copy-Item modes/_company_profile.template.md modes/_company_profile.md
npm run doctor
```

Then replace every placeholder with approved information about your firm. These user-layer files are ignored by Git.

## Workflow

### 1. Discover opportunities

Configure `config/rfp_sources.yml`, then run:

```powershell
npm run scan
```

Supported source types are `manual`, `rss`/`atom`, and configurable `json`. Add opportunities found through an AI search, procurement database, email, or browser directly to `data/rfp_pipeline.md`; discovery does not depend on a particular AI's web-search tool.

### 2. Normalize an opportunity

Create a YAML file in `data/opportunities/` based on [examples/opportunity.example.yml](examples/opportunity.example.yml). Preserve the authoritative RFP and amendments separately.

### 3. Evaluate bid/no-bid

```powershell
npm run evaluate -- data/opportunities/RFP-0001.yml
```

Hard-gate failures override a strong fit score. Unknown deadlines, eligibility, capacity, terms, or professional-scope fit produce `Needs Clarification`.

### 4. Create a proposal workspace

```powershell
npm run proposal -- data/opportunities/RFP-0001.yml
```

The workspace starts with compliance and review artifacts before narrative drafting. It is intentionally a draft workspace, not an auto-submission tool.

### 5. Validate

```powershell
npm test
npm run doctor
```

## Data boundary

Firm-specific and opportunity-specific working files are private by default:

- `capability_statement.md`
- `config/company_profile.yml`
- `config/rfp_sources.yml`
- `modes/_company_profile.md` and `_custom.md`
- `case-studies/`, `team/`, and `writing-samples/`
- `data/`, `reports/`, and `proposals/`

Public examples must be fictional, anonymized with permission, or clearly licensed. Never commit credentials, confidential client records, proprietary RFP documents, or unsupported performance claims.

## AI usage

From the repository root, plain-language prompts work across tools:

```text
Run consulting-ops doctor and guide me through missing onboarding files.
Capture this RFP into the normalized opportunity schema and preserve source references.
Evaluate RFP-0001 using consulting-ops hard gates and scoring.
Create the proposal workspace for RFP-0001, then help me complete the compliance matrix.
```

Agents must follow [AGENTS.md](AGENTS.md) and never invent qualifications or perform final submission.

## Roadmap

See [implementation_plan.md](implementation_plan.md) for the phased rewrite, validation gates, and deferred integrations.

## License

MIT. See [LICENSE](LICENSE) and [UPSTREAM.md](UPSTREAM.md).
