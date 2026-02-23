#!/usr/bin/env bash
set -euo pipefail
cd /home/sectrue/leasing-web/backend
npm ci
npm run build
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart leasing-backend || pm2 start npm --name leasing-backend -- start
  pm2 save
else
  pkill -f "node dist/index.js" || true
  nohup npm start > /home/sectrue/leasing-backend.log 2>&1 &
fi
curl -fsS http://127.0.0.1:3001/health >/dev/null
echo "Backend deploy ok"