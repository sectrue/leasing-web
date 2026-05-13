#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/sectrue/leasing-web"
FRONTEND_DIR="$ROOT/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
PUBLIC_DIR="/var/www/leasing-web"
LIVE_URL="http://192.168.0.254"

export PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH"

echo "[1/4] Build frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "[2/4] Publish to Nginx root ($PUBLIC_DIR)..."
mkdir -p "$PUBLIC_DIR"
rsync -a --delete "$DIST_DIR"/ "$PUBLIC_DIR"/

echo "[3/4] Verify published files..."
ls -1 "$PUBLIC_DIR/assets" | tail -n 5

echo "[4/4] Verify live HTML asset refs ($LIVE_URL)..."
curl -s "$LIVE_URL" | grep -Eo 'index-[A-Za-z0-9_-]+\.(js|css)' || true

echo "Frontend online deploy OK"
