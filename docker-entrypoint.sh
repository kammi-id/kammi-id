#!/bin/sh
set -e

# ADR 0008: gate is the absence of RUN_MIGRATIONS, not the absence of the
# tooling. Non-production sets it; production does not, and stays manual.
if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "RUN_MIGRATIONS=1 — running database migrations"
  bun src/scripts/db-guard.ts
  bunx drizzle-kit migrate
fi

exec "$@"
