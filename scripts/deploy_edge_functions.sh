#!/usr/bin/env bash
set -euo pipefail

# Deploy Supabase Edge Functions in this repo using the supabase CLI.
# Usage:
#   export SUPABASE_PROJECT_REF=myprojectref        # optional if VITE_SUPABASE_URL present in .env.local
#   export SUPABASE_ACCESS_TOKEN=...                # optional (makes supabase CLI non-interactive)
#   export SERVICE_ROLE_KEY=...                     # optional - will be uploaded as a secret if present
#   export SB_URL=https://kfjvevfrzqnxlerwrtaa.supabase.co   # optional - will be uploaded as a secret if present
#   ./scripts/deploy_edge_functions.sh
#
# The script will:
#  - require `supabase` CLI to be installed
#  - determine the project ref (from SUPABASE_PROJECT_REF or .env.local VITE_SUPABASE_URL)
#  - deploy each function directory under `supabase/functions/` using `supabase functions deploy <name>`
#  - optionally upload SERVICE_ROLE_KEY and SB_URL as project secrets

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
FUNCTIONS_DIR="$ROOT_DIR/supabase/functions"

if ! command -v supabase >/dev/null 2>&1; then
  echo "ERROR: supabase CLI not found. Install it from https://supabase.com/docs/guides/cli"
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"

# Try to derive PROJECT_REF from .env.local VITE_SUPABASE_URL if not set
if [ -z "$PROJECT_REF" ]; then
  ENV_LOCAL="$ROOT_DIR/.env.local"
  if [ -f "$ENV_LOCAL" ]; then
    VITE_URL=$(grep -E '^VITE_SUPABASE_URL=' "$ENV_LOCAL" || true)
    if [ -n "$VITE_URL" ]; then
  # extract host like https://<ref>.supabase.co
  # remove the VITE_SUPABASE_URL= prefix then strip any single/double quotes safely
  HOST=$(echo "$VITE_URL" | sed -E 's/^VITE_SUPABASE_URL=//' | tr -d '"' | tr -d "'" )
      # extract project-ref as the subdomain
      PROJECT_REF=$(echo "$HOST" | sed -E 's#https?://([^./]+)\.supabase\.co.*#\1#')
    fi
  fi
fi

if [ -z "$PROJECT_REF" ]; then
  echo "ERROR: SUPABASE_PROJECT_REF not set and could not be derived from .env.local."
  echo "Set SUPABASE_PROJECT_REF to your project ref (e.g. kfjvevfrzqnxlerwrtaa) and retry."
  exit 1
fi

echo "Using Supabase project ref: $PROJECT_REF"

# If SUPABASE_ACCESS_TOKEN is set, export it so supabase CLI can use it non-interactively
if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  export SUPABASE_ACCESS_TOKEN
  echo "Using SUPABASE_ACCESS_TOKEN from environment (hidden)"
fi

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "No functions directory found at $FUNCTIONS_DIR. Nothing to deploy."
  exit 0
fi

echo "Deploying functions from $FUNCTIONS_DIR"

for fn_path in "$FUNCTIONS_DIR"/*; do
  if [ -d "$fn_path" ]; then
    fn_name=$(basename "$fn_path")
    echo "-- Deploying function: $fn_name"
    supabase functions deploy "$fn_name" --project-ref "$PROJECT_REF"
  fi
done

echo "All functions deployed."

# Optionally set secrets
SECRETS_SET=0
if [ -n "${SERVICE_ROLE_KEY:-}" ]; then
  echo "Uploading secret SERVICE_ROLE_KEY (hidden)"
  supabase secrets set SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" --project-ref "$PROJECT_REF"
  SECRETS_SET=1
fi
if [ -n "${SB_URL:-}" ]; then
  echo "Uploading secret SB_URL"
  supabase secrets set SB_URL="$SB_URL" --project-ref "$PROJECT_REF"
  SECRETS_SET=1
fi

if [ "$SECRETS_SET" -eq 1 ]; then
  echo "Secrets uploaded. Note: secrets are stored encrypted in the Supabase project."
fi

echo "Next steps:"
echo " - In the Supabase dashboard -> API, copy the ANON key and set it in your local .env.local as VITE_SUPABASE_ANON_KEY" 
echo " - If your scoreboard-api runs separately, update its DATABASE_URL to point to the new project and restart it"
echo " - If you didn't provide SERVICE_ROLE_KEY above, set it in your project secrets before running functions that need it"

echo "Done."
