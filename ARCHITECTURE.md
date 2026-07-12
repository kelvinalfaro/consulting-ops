# Architecture

`consulting-ops` is a local-first Node.js CLI over Markdown, YAML, source documents, and generated review artifacts.

## Layers

1. **Command layer** — `consulting-ops.mjs` dispatches stable commands; `package.json` exposes npm aliases.
2. **Domain layer** — capture, extraction, hard gates, scoring, compliance, proposal, tracker, deadline, follow-up, and outcome tools.
3. **Provider layer** — built-in source types plus adapters loaded from `providers/` and private `plugins.local/`.
4. **Portable agent layer** — `AGENTS.md`, mode instructions, and thin vendor skill adapters call the same core commands.
5. **User layer** — ignored firm evidence, opportunity records, raw sources, reports, proposals, and tracker data.

## Trust boundary

Raw solicitations and amendments are authoritative. Normalized YAML is a working index and must retain source references. Extraction may populate facts but must not convert ambiguity into certainty. Narrative generation may use only approved firm sources. No command sends a communication or submits a proposal.

## Extensibility

Discovery providers return normalized discovery items. Mode instructions describe human/AI collaboration while deterministic scripts own filesystem mutation and calculations. New connectors belong in plugins when they require credentials, paid services, or organization-specific behavior.

## Update boundary

Public scripts, libraries, modes, templates, examples, and adapters are system files. Firm configuration, evidence, opportunity data, reports, proposals, local plugins, credentials, and update snapshots are private user files and are never release payloads.
