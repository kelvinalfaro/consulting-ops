# consulting-ops project log

## 2026-07-17 - Lifecycle routing and contracted-engagement intake

**Objective:** Extend the public concierge beyond pursuit operations while keeping private financial-analysis implementation outside this repository.

**Completed:** Added independently written lifecycle routing for inquiry and engagement design, RFP/RFQ pursuits, proposals and SOWs, accepted-agreement intake, active-engagement stewardship, private management financial analysis when installed, and direct sponsor communication. Added a contracted-engagement intake reference that confirms the authoritative folder and charter, inventories evidence without altering sources, separates confirmed terms from assumptions and gaps, assesses kickoff readiness, and links the intake record from the engagement project log. Kept Consulting Ops system onboarding, engagement intake, and financial-analysis intake distinct.

**Synchronization:** Reinstalled the repository-bundled `consulting-concierge` to Kelvin's portable and Codex discovery locations. All six bundled skill files have matching hashes across the repository, `C:\Users\Kelvin\.agents\skills`, and the shared skill junction.

**Validation:** Added eight routing fixtures and two executable concierge-routing tests. The full Consulting Ops gate passed: 87/87 tests, parity audit, release/privacy audit, workspace verification, and package dry run. No release, push, or publication was performed.

## 2026-07-16 - Public external-workspace installer and concierge architecture

**Objective:** Make the public product install like Kelvin's separated setup while remaining AI-agent agnostic.

**Completed:** Added persistent workspace resolution, `consulting-ops setup`, portable/native Agent Skill installation, and the bundled `consulting-concierge` primary interface. System assets now resolve from the package while private files resolve from the configured workspace. This supersedes the disposable-runtime synchronization approach described in older entries; those runtime copies are no longer part of the intended product architecture.

**Validation:** A clean temporary install created and onboarded an external workspace, installed the skill to portable, Codex, Gemini, and Claude locations, and ran doctor and tracker successfully. The full test, parity, release/privacy, tracker, and package gates passed.

**Evaluation hardening:** During the Scenic Rivers Land Trust evaluation, corrected budget normalization so a missing amount remains unknown rather than being coerced to zero and incorrectly flagged below the configured firm minimum. Added regression coverage for both the amount and minimum comparison.

**Pursuit hardening:** Preserved tracker numbering across parse/render cycles and allowed a closed `Duplicate` capture to retain an unknown issuer without failing workspace verification. Both behaviors have regression coverage.

**Concierge refinement:** Updated the bundled `consulting-concierge` skill to copy authoritative RFPs and amendments into an active proposal workspace when a pursuit begins, recommend status-aware next steps after completed tasks, and reserve all outward-facing or commitment actions for the user.

**Claim validation:** Proposal quality checks now treat preserved solicitation and clarification files in a proposal's `source/` folder, plus its evidence map, as approved evidence for client-stated metrics. Added regression coverage using a client-confirmed budget.

## 2026-07-15 - Google Antigravity launcher option

**Objective:** Make the existing Consulting Ops and Career Ops Windows launchers able to open either the local Ollama/Qwen paths or Google Antigravity.

**Later decision:** The local Windows launchers were retired in favor of the shared `career-concierge` and `consulting-concierge` skills. The package inventory, parity audit, and README no longer require or advertise the Consulting Ops launcher. Private Consulting Ops data now lives at `G:\Shared drives\Consulting\Alfaro Consulting\consulting-ops`; the local repository is system-only and a disposable local runtime receives synchronized user data for execution.

**Completed:**

- Added Google Antigravity as option 4 in both existing `.cmd` launchers.
- Kept Antigravity independent of the Ollama prerequisite checks and added an `agy` availability check with the documented Windows installation command.
- Preserved the existing Codex + Qwen default, Claude Code experiment, plain Ollama chat, and Codex configuration backup guard.
- Updated the local Career Ops consumer checkout from 1.19.0 to 1.20.0 on a named local branch and added its official updater as launcher option 5.
- Reviewed the complete career-ops 1.20.0 delta. Recorded canonical capability matching and redirect revalidation as roadmap requirements; excluded CareerOps manifesto/community automation because it has no RFP operating equivalent.
- Added [`docs/CAREER_OPS_1_20_PORT.md`](docs/CAREER_OPS_1_20_PORT.md) and made both 1.19 and 1.20 parity records required by the executable parity audit.

**Validation:**

- Parsed both launchers' menu branches and labels and verified the Antigravity branch invokes `agy` from the correct repository root.

## 2026-07-11 to 2026-07-14 - Career-ops parity and command-center startup

**Objective:** Bring consulting-ops closer to career-ops startup parity, strengthen opportunity discovery, and verify the main flows across local and AI-assisted entry points.

**Completed:**

- Strengthened scan filtering, encoding repair, and pipeline placement so actionable opportunities enter `Pending` while generic source leads remain non-actionable.
- Added and audited consulting-native flow parity, command routing, lifecycle safeguards, and source-grounded workflow controls.
- Added a deterministic command-center status layer in [`lib/command-center.mjs`](lib/command-center.mjs).
- Changed an empty `consulting-ops` invocation to run readiness and update checks once and display a concise primary menu; retained the complete reference behind `node consulting-ops.mjs more`.
- Aligned the Codex and Claude skill adapters with the direct `node consulting-ops.mjs` source-checkout router and corrected silent direct-command behavior such as `tracker`.
- Documented the separate Codex Windows sandbox `Access is denied (os error 5)` failure mode in [`README.md`](README.md).
- Added command-center, adapter, parity, and direct-route regression tests in [`tests/consulting-ops/command-center.test.mjs`](tests/consulting-ops/command-center.test.mjs).
- Added parity records in [`PARITY.md`](PARITY.md) and [`FLOW_PARITY.json`](FLOW_PARITY.json) so future reviews can distinguish literal file parity from RFP-native functional equivalents.
- Expanded the repository beyond the initial RFP core with capture/extraction, amendment handling, deadline monitoring, proposal exports, research, follow-up, debrief, outcome analysis, submission-readiness checks, provider plugins, updating/rollback, and multi-CLI adapters.
- Established the authoritative shared consulting workspace at `G:\Shared drives\Consulting\Alfaro-Consulting-Ops-Workspace` and preserved `C:\Users\Kelvin\consulting-ops` as the local source repository/fallback.
- Established the corresponding career workspace at `G:\Shared drives\Consulting\Kelvin-Career-Ops-Workspace` and copied the documented private user layers without modifying the original local repositories.
- Added per-workspace setup scripts and `consulting-ops` / `career-ops` command wrappers. Each computer keeps dependencies and runtime code under `%LOCALAPPDATA%\Alfaro-Ops-Runtimes`; Google Drive does not synchronize `node_modules`.
- Added career-ops user-layer synchronization around wrapped commands because upstream career-ops still resolves many working files relative to its runtime directory. The wrapper synchronizes before execution and back to the shared workspace afterward.
- Registered both shared workspace command folders on the Windows user `PATH`; a newly opened terminal can call `consulting-ops <command>` or `career-ops <command>` from any directory.
- Reviewed career-ops 1.19.0 feature-by-feature and ported the RFP-native equivalents: budget reliability, freshness and issuer exclusions, configurable analysis caps that preserve authoritative sources, pursuit-funnel calibration, and proposal metric validation. The mapping and excluded job-only features are in [`docs/CAREER_OPS_1_19_PORT.md`](docs/CAREER_OPS_1_19_PORT.md).
- Added a local Ollama/Qwen RFP evaluator that loads only approved firm sources, validates Blocks A-H and the bid summary, repairs a missing summary locally, writes review reports only, and never updates the tracker or authorizes submission.
- Added double-click launchers in both local source repositories. Testing showed Qwen ignored Claude Code skill/tool instructions even with a materialized skill and explicit system prompt, while the Ollama Codex integration successfully executed the consulting-ops router with shell tools. The launchers therefore default to tested Codex + Qwen, show deterministic menu guidance first, retain Claude Code as experimental, and offer plain tool-less Qwen chat.
- Verified Ollama 0.32.0 keeps its Codex provider settings in `~/.codex/ollama-launch.config.toml` and did not modify the primary `~/.codex/config.toml`. Added launcher guards that back up and compare the primary config and offer immediate restoration if a future Ollama version changes it unexpectedly.

**Validation:**

- `npm test`: 75/75 tests passed.
- `npm run audit:parity`, release audit, package dry run, and `git diff --check` passed.
- Live Codex CLI smoke tests passed for `consulting-ops` and `consulting-ops tracker`.
- Hashes for the private tracker, pipeline, and scan-history files were unchanged after smoke testing.
- Shared-workspace integrity checks confirmed matching hashes for the consulting capability statement/profile and career CV/profile/portals files.
- Shared consulting `doctor` and `stats` passed; shared career `doctor`, `verify`, and `stats` passed. Career doctor retains one non-blocking warning that Playwright MCP is not configured, while installed Chromium and deterministic commands work.
- Confirmed neither shared workspace contains a synchronized `node_modules` directory.
- Version 0.3.0 validation passed: 80/80 RFP-native tests, parity audit, release/privacy audit, tracker verification, package dry-run, focused Ollama transport/repair coverage, and clean diff checks.
- The final live consulting-ops Qwen smoke test was deferred because Ollama began an in-place desktop upgrade after the successful career-ops live test; the evaluator correctly failed closed while the local service was unavailable.

**Publication:**

- `f480c92` - Add career-ops parity and strengthen discovery.
- `c7ec0c7` - Streamline command center startup.
- The first change set merged through GitHub PR #1. The follow-up startup work is in [draft PR #2](https://github.com/kelvinalfaro/consulting-ops/pull/2).

**Current working-tree note:** Thin adapters for Claude, Antigravity, Grok, Kimi, OpenCode, and Qwen have an uncommitted cleanup that points each adapter to the canonical `.agents` skill. Review portability and package behavior before committing it.

**Next steps:**

1. Review and merge PR #2.
2. Validate or revise the uncommitted thin-adapter cleanup across supported CLIs.
3. Continue flow-by-flow parity testing against career-ops, with extra attention to live scan quality, clean-install behavior, and non-Codex invocation.
4. Re-run the full test, parity, release/privacy, package, and end-to-end gates before the next release.
5. On each additional Windows computer, run `Setup Consulting Ops.cmd` and `Setup Career Ops.cmd` once, then open a new terminal so the registered commands are available.
6. Avoid simultaneous tracker-writing commands from multiple computers because cloud synchronization can still create competing file versions despite application-level locking.
