---
summary: "Install AIPro, onboard the Gateway, and pair your first channel."
read_when:
  - You want the fastest path from install to a working Gateway
title: "Quick start"
---

<Note>
AIPro requires Node 22 or newer.
</Note>

## Install

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g aipro@latest
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g aipro@latest
    ```
  </Tab>
</Tabs>

## Onboard and run the Gateway

<Steps>
  <Step title="Onboard and install the service">
    ```bash
    aipro onboard --install-daemon
    ```
  </Step>
  <Step title="Pair WhatsApp">
    ```bash
    aipro channels login
    ```
  </Step>
  <Step title="Start the Gateway">
    ```bash
    aipro gateway --port 18789
    ```
  </Step>
</Steps>

After onboarding, the Gateway runs via the user service. You can still run it manually with `aipro gateway`.

<Info>
Switching between npm and git installs later is easy. Install the other flavor and run
`aipro doctor` to update the gateway service entrypoint.
</Info>

## From source (development)

```bash
git clone https://github.com/aipro/aipro.git
cd aipro
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
aipro onboard --install-daemon
```

If you do not have a global install yet, run onboarding via `pnpm aipro ...` from the repo.

## Multi instance quickstart (optional)

```bash
AIPRO_CONFIG_PATH=~/.aipro/a.json \
AIPRO_STATE_DIR=~/.aipro-a \
aipro gateway --port 19001
```

## Send a test message

Requires a running Gateway.

```bash
aipro message send --target +15555550123 --message "Hello from AIPro"
```
