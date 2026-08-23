#!/usr/bin/env bash
# Uploads riceology/games/ to a Cloudflare R2 bucket.
#
# Requires the AWS CLI (R2 is S3-compatible) and these env vars set first:
#   R2_ACCOUNT_ID          - Cloudflare account ID (dash.cloudflare.com, right sidebar)
#   R2_ACCESS_KEY_ID       - from an R2 API token
#   R2_SECRET_ACCESS_KEY   - from the same R2 API token
#   R2_BUCKET              - the bucket name, e.g. riceology-games
#
# Usage:
#   export R2_ACCOUNT_ID=...
#   export R2_ACCESS_KEY_ID=...
#   export R2_SECRET_ACCESS_KEY=...
#   export R2_BUCKET=riceology-games
#   ./upload-to-r2.sh

set -euo pipefail

: "${R2_ACCOUNT_ID:?set R2_ACCOUNT_ID}"
: "${R2_ACCESS_KEY_ID:?set R2_ACCESS_KEY_ID}"
: "${R2_SECRET_ACCESS_KEY:?set R2_SECRET_ACCESS_KEY}"
: "${R2_BUCKET:?set R2_BUCKET}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAMES_DIR="$SCRIPT_DIR/../games"
ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

if [ ! -d "$GAMES_DIR" ]; then
  echo "No games/ directory found at $GAMES_DIR — nothing to upload." >&2
  exit 1
fi

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 sync "$GAMES_DIR" "s3://${R2_BUCKET}" \
  --endpoint-url "$ENDPOINT" \
  --region auto \
  --no-progress

echo "Synced $GAMES_DIR -> s3://${R2_BUCKET} via $ENDPOINT"
