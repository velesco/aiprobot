---
summary: "CLI reference for `aipro config` (get/set/unset config values)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `aipro config`

Config helpers: get/set/unset values by path. Run without a subcommand to open
the configure wizard (same as `aipro configure`).

## Examples

```bash
aipro config get browser.executablePath
aipro config set browser.executablePath "/usr/bin/google-chrome"
aipro config set agents.defaults.heartbeat.every "2h"
aipro config set agents.list[0].tools.exec.node "node-id-or-name"
aipro config unset tools.web.search.apiKey
```

## Paths

Paths use dot or bracket notation:

```bash
aipro config get agents.defaults.workspace
aipro config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
aipro config get agents.list
aipro config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--json` to require JSON5 parsing.

```bash
aipro config set agents.defaults.heartbeat.every "0m"
aipro config set gateway.port 19001 --json
aipro config set channels.whatsapp.groups '["*"]' --json
```

Restart the gateway after edits.
