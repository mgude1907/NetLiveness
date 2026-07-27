#!/usr/bin/env bash
# Geliştirme bilgisayarından Linux sunucuya rsync + systemctl restart
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${DEPLOY_ENV:-$ROOT/deploy.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Eksik yapılandırma: $ENV_FILE"
  echo "Örnek: cp deploy.env.example deploy.env"
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

: "${DEPLOY_HOST:?DEPLOY_HOST gerekli}"
: "${DEPLOY_USER:?DEPLOY_USER gerekli}"
: "${DEPLOY_PATH:?DEPLOY_PATH gerekli}"

SSH_PORT="${DEPLOY_SSH_PORT:-22}"
SSH_OPTS=(-p "$SSH_PORT" -o BatchMode=yes)
RSYNC_SSH="ssh ${SSH_OPTS[*]}"

"$SCRIPT_DIR/build_release.sh"

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "==> Sunucuya kopyalanıyor: $REMOTE"
rsync -avz --delete \
  -e "$RSYNC_SSH" \
  --exclude 'api/netliveness_v2.db' \
  --exclude 'api/wwwroot/uploads/' \
  --exclude 'api/logs/' \
  --exclude 'worker/logs/' \
  "$ROOT/dist/linux/" "$REMOTE"

if [[ "${DEPLOY_PHISHING:-0}" == "1" ]]; then
  echo "==> Phishing bağımlılıkları (npm ci)"
  ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
    "cd '${DEPLOY_PATH}/phishing' && npm ci --omit=dev"
fi

SERVICES=(netliveness-api.service netliveness-worker.service)
if [[ "${DEPLOY_PHISHING:-0}" == "1" ]]; then
  SERVICES+=(netliveness-phishing.service)
fi

echo "==> Servisler yeniden başlatılıyor"
ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "sudo systemctl daemon-reload && sudo systemctl restart ${SERVICES[*]} && sudo systemctl --no-pager status netliveness-api.service"

echo "==> Yayın tamamlandı"
