#!/usr/bin/env bash
set -euo pipefail

# WorkOS cutover for one database. Run from anywhere BEFORE deploying this
# branch, with the target database's credentials:
#
#   DATABASE_URL=... WORKOS_API_KEY=... bash packages/db/src/scripts/cutover-workos.sh
#
# Step 1 applies schema migrations up to 0063 only (additive: mapping columns
# + social_connections). Step 2 runs the WorkOS data migration while the
# accounts table still exists. The destructive migrations (0064+) are NOT
# applied here - deploying the branch applies them automatically, or pass
# --finalize to apply them immediately.

cd "$(dirname "$0")/../../../.."

JOURNAL=packages/db/migrations/meta/_journal.json
BACKUP="$JOURNAL.full"

if [ -z "${DATABASE_URL:-}" ] || [ -z "${WORKOS_API_KEY:-}" ]; then
  echo "DATABASE_URL and WORKOS_API_KEY must be set" >&2
  exit 1
fi

restore_journal() {
  if [ -f "$BACKUP" ]; then
    mv "$BACKUP" "$JOURNAL"
  fi
}
trap restore_journal EXIT

cp "$JOURNAL" "$BACKUP"
bun -e '
const fs = require("fs");
const path = "packages/db/migrations/meta/_journal.json";
const journal = JSON.parse(fs.readFileSync(path, "utf8"));
journal.entries = journal.entries.filter((entry) => entry.idx <= 63);
fs.writeFileSync(path, JSON.stringify(journal, null, 2));
'

echo "[1/3] Applying schema migrations up to 0063..."
bunx drizzle-kit migrate --config packages/db/drizzle.config.ts

restore_journal
trap - EXIT

echo "[2/3] Running the WorkOS data migration..."
(cd packages/db && bun run migrate:workos)

if [ "${1:-}" = "--finalize" ]; then
  echo "[3/3] Applying remaining destructive migrations (0064+)..."
  bunx drizzle-kit migrate --config packages/db/drizzle.config.ts
else
  echo "[3/3] Skipped. Deploy the branch to apply 0064+ (or rerun with --finalize)."
fi
