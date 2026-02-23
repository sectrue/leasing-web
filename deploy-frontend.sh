#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH"
cd /home/sectrue/leasing-web/frontend
npm run build
sudo mkdir -p /var/www/leasing-web
sudo rm -rf /var/www/leasing-web/*
sudo cp -r /home/sectrue/leasing-web/frontend/dist/* /var/www/leasing-web/
sudo systemctl reload nginx
echo "Frontend deploy ok"