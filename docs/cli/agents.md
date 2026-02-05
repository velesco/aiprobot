---
summary: "CLI reference for `aipro agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `aipro agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
aipro agents list
aipro agents add work --workspace ~/.aipro/workspace-work
aipro agents set-identity --workspace ~/.aipro/workspace --from-identity
aipro agents set-identity --agent main --avatar avatars/aipro.png
aipro agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.aipro/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
aipro agents set-identity --workspace ~/.aipro/workspace --from-identity
```

Override fields explicitly:

```bash
aipro agents set-identity --agent main --name "AIPro" --emoji "🦞" --avatar avatars/aipro.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "AIPro",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/aipro.png",
        },
      },
    ],
  },
}
```
