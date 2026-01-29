#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${AIPRO_INSTALL_E2E_IMAGE:-aipro-install-e2e:local}"
INSTALL_URL="${AIPRO_INSTALL_URL:-https://aipro.ro/install.sh}"

OPENAI_API_KEY="${OPENAI_API_KEY:-}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
ANTHROPIC_API_TOKEN="${ANTHROPIC_API_TOKEN:-}"
AIPRO_E2E_MODELS="${AIPRO_E2E_MODELS:-}"

echo "==> Build image: $IMAGE_NAME"
docker build \
  -t "$IMAGE_NAME" \
  -f "$ROOT_DIR/scripts/docker/install-sh-e2e/Dockerfile" \
  "$ROOT_DIR/scripts/docker/install-sh-e2e"

echo "==> Run E2E installer test"
docker run --rm \
  -e AIPRO_INSTALL_URL="$INSTALL_URL" \
  -e AIPRO_INSTALL_TAG="${AIPRO_INSTALL_TAG:-latest}" \
  -e AIPRO_E2E_MODELS="$AIPRO_E2E_MODELS" \
  -e AIPRO_INSTALL_E2E_PREVIOUS="${AIPRO_INSTALL_E2E_PREVIOUS:-}" \
  -e AIPRO_INSTALL_E2E_SKIP_PREVIOUS="${AIPRO_INSTALL_E2E_SKIP_PREVIOUS:-0}" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -e ANTHROPIC_API_TOKEN="$ANTHROPIC_API_TOKEN" \
  "$IMAGE_NAME"
