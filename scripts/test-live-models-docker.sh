#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${AIPRO_IMAGE:-aipro:local}"
CONFIG_DIR="${AIPRO_CONFIG_DIR:-$HOME/.aipro}"
WORKSPACE_DIR="${AIPRO_WORKSPACE_DIR:-$HOME/clawd}"
PROFILE_FILE="${AIPRO_PROFILE_FILE:-$HOME/.profile}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e AIPRO_LIVE_TEST=1 \
  -e AIPRO_LIVE_MODELS="${AIPRO_LIVE_MODELS:-all}" \
  -e AIPRO_LIVE_PROVIDERS="${AIPRO_LIVE_PROVIDERS:-}" \
  -e AIPRO_LIVE_MODEL_TIMEOUT_MS="${AIPRO_LIVE_MODEL_TIMEOUT_MS:-}" \
  -e AIPRO_LIVE_REQUIRE_PROFILE_KEYS="${AIPRO_LIVE_REQUIRE_PROFILE_KEYS:-}" \
  -v "$CONFIG_DIR":/home/node/.aipro \
  -v "$WORKSPACE_DIR":/home/node/clawd \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"
