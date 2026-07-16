# Architecture

`consulting-ops` is a local-first Node.js CLI over Markdown, YAML, source documents, and generated review artifacts.

## Layers

1. **Command layer** — `consulting-ops.mjs` dispatches stable commands; `package.json` exposes npm aliases.
2. **Domain layer** — capture, extraction, hard gates, scoring, compliance, proposal, tracker, deadline, follow-up, and outcome tools.
3. **Provider layer** — built-in source types plus adapters loaded from `providers/` and private `plugins.local/`.
4. **Portable agent layer** — `AGENTS.md`, mode instructions, and thin vendor skill adapters call the same core commands.
5. **Workspace/config layer** — `lib/workspace.mjs` resolves a private external workspace from an explicit flag, environment variable, saved user config, or backward-compatible current directory.
6. **User layer** — external firm evidence, opportunity records, raw sources, reports, proposals, and tracker data.

## Trust boundary

Raw solicitations and amendments are authoritative. Normalized YAML is a working index and must retain source references. Extraction may populate facts but must not convert ambiguity into certainty. Narrative generation may use only approved firm sources. No command sends a communication or submits a proposal.

## Extensibility

Discovery providers return normalized discovery items. Mode instructions describe human/AI collaboration while deterministic scripts own filesystem mutation and calculations. New connectors belong in plugins when they require credentials, paid services, or organization-specific behavior.

## Update boundary

Public scripts, libraries, modes, templates, examples, and adapters are system files. Firm configuration, evidence, opportunity data, reports, proposals, local plugins, and credentials live in the configured workspace and are never release payloads. System commands run with that workspace as their working directory; immutable schemas and neutral templates resolve from the installed package.

`consulting-ops setup` persists only the workspace location in `~/.consulting-ops/config.json`, installs the portable concierge skill, and validates the boundary. Updating or replacing the package does not require copying the user layer into a runtime directory.
