#!/usr/bin/env bash
set -euo pipefail

cd /repo

export AIPRO_STATE_DIR="/tmp/aipro-test"
export AIPRO_CONFIG_PATH="${AIPRO_STATE_DIR}/aipro.json"

echo "==> Seed state"
mkdir -p "${AIPRO_STATE_DIR}/credentials"
mkdir -p "${AIPRO_STATE_DIR}/agents/main/sessions"
echo '{}' >"${AIPRO_CONFIG_PATH}"
echo 'creds' >"${AIPRO_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${AIPRO_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm aipro reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${AIPRO_CONFIG_PATH}"
test ! -d "${AIPRO_STATE_DIR}/credentials"
test ! -d "${AIPRO_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${AIPRO_STATE_DIR}/credentials"
echo '{}' >"${AIPRO_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm aipro uninstall --state --yes --non-interactive

test ! -d "${AIPRO_STATE_DIR}"

echo "OK"
