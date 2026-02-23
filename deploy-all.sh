#!/usr/bin/env bash
set -euo pipefail
/home/sectrue/leasing-web/deploy-backend.sh
/home/sectrue/leasing-web/deploy-frontend.sh
echo "Full deploy ok"