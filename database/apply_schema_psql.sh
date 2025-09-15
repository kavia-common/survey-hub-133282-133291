#!/usr/bin/env bash
# Apply the project schema to a Postgres/Supabase instance using psql.
# Usage:
#   ./apply_schema_psql.sh "$POSTGRES_URL"
# The POSTGRES_URL should be your full Postgres connection string from Supabase (Project Settings -> Database).

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 \"<POSTGRES_CONNECTION_STRING>\""
  exit 1
fi

CONN_STR="$1"

echo "Applying schema from database/schema.sql..."
psql "$CONN_STR" -v ON_ERROR_STOP=1 -f "$(dirname "$0")/schema.sql"

echo "Done. If the frontend still shows a schema cache error, visit the Supabase Dashboard Table Editor (public schema) or run a benign DDL to refresh the cache."
