#!/bin/sh
set -e

# ADR 0008: gate is the absence of RUN_MIGRATIONS, not the absence of the
# tooling. Non-production sets it; production does not, and stays manual.
if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "RUN_MIGRATIONS=1 — running duplicate preflight and guarded migrations"
  bun src/scripts/check-duplicates.ts
  bun src/scripts/migrate.ts
  if [ "$MIGRATIONS_ONLY" = "1" ]; then
    exit 0
  fi
fi

exec "$@"
