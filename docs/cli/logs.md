---
summary: "CLI reference for `aipro logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
---

# `aipro logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:
- Logging overview: [Logging](/logging)

## Examples

```bash
aipro logs
aipro logs --follow
aipro logs --json
aipro logs --limit 500
```

