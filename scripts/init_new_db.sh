#!/usr/bin/env bash
# Initialize a fresh Supabase Postgres database for this branch.
# Usage (zsh):
#
#   export NEW_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
#   ./scripts/init_new_db.sh
#
# The script will:
#  - verify psql is available
#  - create necessary extensions (pgcrypto)
#  - run the migration SQL in supabase/migrations/

set -euo pipefail

if [ -z "${NEW_DATABASE_URL:-}" ]; then
  echo "ERROR: NEW_DATABASE_URL is not set."
  echo "Set it to your new Supabase Postgres connection string, e.g."
  echo "  export NEW_DATABASE_URL=\"postgresql://postgres:YOUR_PASSWORD@db.example.supabase.co:5432/postgres\""
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found in PATH. Install the Postgres client (psql) and retry."
  exit 1
fi

echo "Using NEW_DATABASE_URL=${NEW_DATABASE_URL}"

echo "Testing DB connection..."
psql "$NEW_DATABASE_URL" -c "select version();"

echo "Creating extensions..."
psql "$NEW_DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

MIGRATION_SQL="supabase/migrations/20260520000000_game_schema.sql"

if [ ! -f "$MIGRATION_SQL" ]; then
  echo "ERROR: Migration SQL not found at $MIGRATION_SQL"
  exit 1
fi

echo "Applying migration SQL: $MIGRATION_SQL"
psql "$NEW_DATABASE_URL" -f "$MIGRATION_SQL"

echo "Initialization complete. Quick checks:"
psql "$NEW_DATABASE_URL" -c "\dt"
psql "$NEW_DATABASE_URL" -c "select count(*) from game_users;"

echo "Done."
