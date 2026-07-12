# @notra/eve-tools

Shared Eve tool definitions and primitives for Notra agents.

Eve derives a tool's public name from its file path, so each agent and subagent
keeps a small adapter file under its own `tools/` directory. Those adapters
re-export definitions from this package instead of recreating them. Add future
cross-agent tool implementations here when they do not depend on one agent's
private schemas or instructions.
