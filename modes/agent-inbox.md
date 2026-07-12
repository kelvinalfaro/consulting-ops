# Agent inbox

Use `node agent-inbox.mjs list` to inspect durable requests in `data/agent-inbox.md`. Route each pending request to the appropriate consulting-ops mode, top to bottom. After completing a request, run `node agent-inbox.mjs resolve <number> --result "<concise result>"`.

Queue requests with `node agent-inbox.mjs add "<request>"`. Do not auto-run items requiring live user judgment, pricing or legal approval, signatures, sending, or submission. Leave those pending and tell the user what input is required.
