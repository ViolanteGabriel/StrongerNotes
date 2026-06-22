#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/e2e/docker-compose.yml"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

cd "$ROOT_DIR"

status=0
npx playwright test "$@" || status=$?
exit "$status"
