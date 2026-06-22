#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/e2e/docker-compose.yml"
CONTAINER_NAME="strongernotes-e2e-mongo"
DATABASE_NAME="strongernotes_e2e"

docker compose -f "$COMPOSE_FILE" up -d

for attempt in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" >/dev/null 2>&1; then
    docker exec "$CONTAINER_NAME" mongosh "$DATABASE_NAME" --quiet --eval "db.dropDatabase()" >/dev/null
    exit 0
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "MongoDB E2E container did not become ready in time." >&2
    exit 1
  fi

  sleep 1
done
