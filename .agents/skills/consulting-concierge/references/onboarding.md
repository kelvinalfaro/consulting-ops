# Onboarding

Run `consulting-ops setup`. It selects or creates a private workspace, saves it as the user's default, installs this skill, and validates readiness.

For unattended setup, use:

`consulting-ops setup --workspace <path> --answers <answers.json> --yes --agent portable`

Use `--agent all` to also place native user-scope copies for Codex, Gemini CLI, and Claude Code. Existing firm files are preserved unless the user explicitly requests `--force`.

Before operational work, review the generated capability statement and company profile, then add approved case studies and team bios. Missing information stays explicit.
