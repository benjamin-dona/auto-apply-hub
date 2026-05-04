#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "ERROR: .env file not found in project root" >&2
  exit 1
fi

DB_URL="$(grep -E '^DB_URL=' .env | head -1 | cut -d= -f2-)"
DB_USERNAME="$(grep -E '^DB_USERNAME=' .env | head -1 | cut -d= -f2-)"
DB_PASSWORD="$(grep -E '^DB_PASSWORD=' .env | head -1 | cut -d= -f2-)"

if [[ -z "$DB_URL" || -z "$DB_USERNAME" || -z "$DB_PASSWORD" ]]; then
  echo "ERROR: DB_URL, DB_USERNAME, DB_PASSWORD must exist in .env" >&2
  exit 1
fi

COMMAND="${1:-update}"
shift || true

MAX_RETRIES="${LIQUIBASE_MAX_RETRIES:-8}"
RETRY_DELAY_SECONDS="${LIQUIBASE_RETRY_DELAY_SECONDS:-10}"

attempt=1
while (( attempt <= MAX_RETRIES )); do
  set +e
  output=$(docker run --rm \
    --env-file .env \
    -v "${ROOT_DIR}":/workspace \
    autoapply-liquibase:local \
    --searchPath=/workspace \
    --url="${DB_URL}" \
    --username="${DB_USERNAME}" \
    --password="${DB_PASSWORD}" \
    --driver=org.postgresql.Driver \
    --changeLogFile=db/changelog/db.changelog-master.yaml \
    "${COMMAND}" "$@" 2>&1)
  status=$?
  set -e

  echo "$output"

  if (( status == 0 )); then
    exit 0
  fi

  if grep -qiE "database system is starting up|connection refused|timeout|could not connect" <<< "$output"; then
    echo "Liquibase attempt ${attempt}/${MAX_RETRIES} failed due to transient DB availability. Retrying in ${RETRY_DELAY_SECONDS}s..." >&2
    sleep "$RETRY_DELAY_SECONDS"
    (( attempt++ ))
    continue
  fi

  exit "$status"
done

echo "Liquibase failed after ${MAX_RETRIES} retries" >&2
exit 1
