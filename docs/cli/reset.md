---
summary: "CLI reference for `aipro reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
---

# `aipro reset`

Reset local config/state (keeps the CLI installed).

```bash
aipro reset
aipro reset --dry-run
aipro reset --scope config+creds+sessions --yes --non-interactive
```

