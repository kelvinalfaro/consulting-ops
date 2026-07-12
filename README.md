# consulting-ops

An AI-agnostic command center for consulting opportunity discovery, disciplined bid/no-bid decisions, compliant proposal development, submission preparation, and pursuit learning.

`consulting-ops` adapts the portable, local-first operating model of [`santifer/career-ops`](https://github.com/santifer/career-ops) to the RFP lifecycle. It is a domain rewrite: job search concepts are replaced with procurement sources, hard gates, compliance matrices, evidence controls, pursuit states, amendments, proposal workspaces, and human submission safeguards. See [UPSTREAM.md](UPSTREAM.md).

No command submits a proposal. Pricing, legal terms, representations, signatures, and final submission always require human review.

## Install once, call it from any CLI

Requirements: Node.js 18 or newer and Git.

```powershell
git clone https://github.com/kelvinalfaro/consulting-ops.git
cd consulting-ops
npm install
npm link
consulting-ops onboard
consulting-ops doctor
```

For non-interactive setup, copy and edit `examples/onboarding-answers.example.json`, then run `consulting-ops onboard --answers <file> [--target <workspace>]`.

`npm link` makes `consulting-ops` available in PowerShell, Command Prompt, Bash, zsh, and AI coding-tool terminals. If you prefer not to install a global link, use `npx consulting-ops <command>` or `npm run <script> -- <arguments>` from the repository.

To bootstrap into a new folder from an already installed copy:

```powershell
consulting-ops init my-consulting-ops
cd my-consulting-ops
npx consulting-ops onboard
```

## One-command workflow

Pass an RFP URL or local PDF, DOCX, HTML, Markdown, or text file directly:

```powershell
consulting-ops https://agency.example/RFP-2026-17.pdf
consulting-ops C:\RFPs\strategic-planning.pdf
```

The auto-pipeline preserves the source, extracts procurement facts, evaluates hard gates and fit, updates the tracker, and creates a proposal workspace only when the evidence supports a `Bid` decision. Unknown hard gates remain `Needs Clarification`; they are never silently treated as satisfied.

## Command center

```text
consulting-ops onboard                         Create private firm-layer files safely
consulting-ops doctor                          Validate setup and boundaries
consulting-ops <URL-or-file>                   Run the complete auto-pipeline
consulting-ops scan                            Discover from configured sources/providers
consulting-ops pipeline                        Process unchecked pipeline entries
consulting-ops batch <sources...>              Process several RFP sources
consulting-ops capture <source>                Preserve source and create a record
consulting-ops extract <record>                Extract dates, requirements, criteria, contacts
consulting-ops amend <record> <source>          Preserve amendment and flag changed fields
consulting-ops evaluate <record>               Run hard gates and weighted bid/no-bid scoring
consulting-ops compare <records...>             Compare pursuit choices
consulting-ops proposal <record>               Create compliance-first proposal workspace
consulting-ops evidence <record>               Create a claim evidence register
consulting-ops contact <record>                Prepare compliant procurement contact brief
consulting-ops email <record>                  Draft, but do not send, procurement email
consulting-ops contract <record>               Create contract issue-spotting checklist
consulting-ops finalist <record>               Create finalist/interview preparation pack
consulting-ops submission <workspace>          Prepare final human review checklist
consulting-ops export <workspace>              Export review-marked PDF/DOCX
consulting-ops tracker list                    Show tracker and metrics
consulting-ops tracker add <record>            Add or update an opportunity
consulting-ops tracker status <id> <state>      Change canonical pursuit state
consulting-ops verify                          Verify tracker fields and canonical states
consulting-ops normalize                       Normalize tracker status aliases
consulting-ops dedup [--dry-run]               Merge duplicate pursuit rows safely
consulting-ops reconcile                       Compare inbox URLs and captured records
consulting-ops liveness                        Check authoritative source URLs
consulting-ops inbox                           Summarize pending, urgent, and unowned work
consulting-ops stats                           Report lifecycle metrics and status counts
consulting-ops find <query>                    Search the tracker
consulting-ops quality <workspace>             Check proposal artifacts and placeholders
consulting-ops deadlines                       Report overdue, urgent, and unknown deadlines
consulting-ops followup                        Build follow-up actions
consulting-ops research <record>               Create source-aware client research brief
consulting-ops debrief <record>                Capture outcome learning
consulting-ops patterns                        Analyze pursuit outcomes
consulting-ops dashboard                       Build read-only HTML dashboard
consulting-ops serve [port]                    Serve dashboard locally
consulting-ops update check|apply|rollback      Manage system-layer updates safely
```

Run `consulting-ops --help` for the compact reference. Each command is also exposed as an npm script in `package.json`.

## Onboarding and private data

`consulting-ops onboard` creates missing files from neutral examples and never overwrites existing firm data by default. Complete:

- `capability_statement.md`
- `config/company_profile.yml`
- `config/rfp_sources.yml`
- `modes/_company_profile.md`
- approved material in `case-studies/`, `team/`, and `writing-samples/`

Those files, plus `data/`, `reports/`, and `proposals/`, are ignored by Git. Public examples must be fictional, permissioned, or clearly licensed. Never store credentials, confidential client material, proprietary RFPs, or unsupported performance claims in the public system layer.

## Discovery providers and plugins

The core supports manual entries, RSS/Atom, JSON APIs, and portable web-search RSS. Configure them in `config/rfp_sources.yml`. Additional provider adapters can live in `providers/` or the ignored `plugins.local/` directory and export:

```js
export default {
  id: 'provider-type',
  async fetch(source, context) {
    return [{ title: '...', url: 'https://...', issuer: '...', source_id: source.id }];
  },
};
```

This keeps paid databases, local credentials, and organization-specific connectors outside the public core.

## Use with AI coding assistants

The scripts and Markdown/YAML contracts are the product API; no AI subscription is required. `AGENTS.md` provides the portable behavior baseline. Equivalent skill adapters are included for Codex/Agents, Claude, OpenCode, Antigravity, Qwen, Grok, and Kimi.

Example prompts:

```text
Run consulting-ops doctor and guide me through any missing private setup files.
Run consulting-ops on this RFP and explain every unknown hard gate.
Create the proposal workspace, then help me complete the compliance matrix using only approved evidence.
Prepare finalist questions, but do not contact the issuer or submit anything.
```

## Data model and safety

The authoritative contract is documented in [DATA_CONTRACT.md](DATA_CONTRACT.md), the system/user boundary in [ARCHITECTURE.md](ARCHITECTURE.md), and lifecycle states in `templates/states.yml`.

Core invariants:

- raw RFPs and amendments remain authoritative;
- unknown procurement facts remain unknown;
- hard-gate failures override a high fit score;
- generated claims require approved evidence;
- compliance is reviewed separately from persuasive narrative;
- commands may prepare artifacts but never send email, sign, price, or submit on the user's behalf.

## Validation and release checks

```powershell
npm test
npm run doctor
npm run audit:release
npm run audit:parity
npm pack --dry-run
```

The tests cover extraction, amendment handling, hard gates, scoring, tracker round-trips, dashboard escaping, proposal controls, PDF/DOCX export, provider plugins, release privacy, deadlines, and the integrated auto-pipeline.

## Updating

```powershell
consulting-ops update check
consulting-ops update apply
consulting-ops update rollback
```

Updates target the public system layer. Private user-layer files are excluded from replacement and rollback snapshots are kept locally.

## Project documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — layers, trust boundaries, extensibility
- [DATA_CONTRACT.md](DATA_CONTRACT.md) — opportunity, tracker, and proposal contracts
- [PARITY.md](PARITY.md) — explicit career-ops to consulting-ops capability mapping
- [implementation_plan.md](implementation_plan.md) — delivery history and remaining validation
- [SECURITY.md](SECURITY.md) — vulnerability reporting and secret handling
- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution workflow
- [UPSTREAM.md](UPSTREAM.md) — career-ops attribution and rewrite boundary
- [GOVERNANCE.md](GOVERNANCE.md), [SUPPORT.md](SUPPORT.md), and [LEGAL_DISCLAIMER.md](LEGAL_DISCLAIMER.md) — project and use boundaries
- [DOCKER.md](DOCKER.md) — optional containerized CLI usage

MIT licensed. See [LICENSE](LICENSE).
