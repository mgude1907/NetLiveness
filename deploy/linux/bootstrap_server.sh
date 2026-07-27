#!/usr/bin/env bash
# Linux sunucuda bir kez çalıştırın (root): kurulum kullanıcısı, dizinler, systemd, Node.js
set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/opt/netliveness}"
APP_USER="${APP_USER:-netliveness}"
ENABLE_PHISHING="${ENABLE_PHISHING:-1}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Bu betik root olarak çalıştırılmalı (sudo)."
  exit 1
fi

if ! id "$APP_USER" &>/dev/null; then
  useradd --system --home-dir "$INSTALL_ROOT" --shell /usr/sbin/nologin "$APP_USER"
fi

mkdir -p "$INSTALL_ROOT"/{api,worker,phishing}
chown -R "$APP_USER:$APP_USER" "$INSTALL_ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js bulunamadı. Kurun (ör. Node 20 LTS) — phishing modülü için gerekli."
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
for unit in netliveness-api.service netliveness-worker.service; do
  sed "s|/opt/netliveness|$INSTALL_ROOT|g" "$SCRIPT_DIR/systemd/$unit" > "/etc/systemd/system/$unit"
done

if [[ "$ENABLE_PHISHING" == "1" ]]; then
  sed "s|/opt/netliveness|$INSTALL_ROOT|g" "$SCRIPT_DIR/systemd/netliveness-phishing.service" \
    > "/etc/systemd/system/netliveness-phishing.service"
fi

systemctl daemon-reload
systemctl enable netliveness-api.service netliveness-worker.service
if [[ "$ENABLE_PHISHING" == "1" ]]; then
  systemctl enable netliveness-phishing.service
fi

echo "Bootstrap tamam. Dosyaları rsync ile $INSTALL_ROOT altına kopyalayın, ardından:"
echo "  sudo systemctl start netliveness-api netliveness-worker"
if [[ "$ENABLE_PHISHING" == "1" ]]; then
  echo "  cd $INSTALL_ROOT/phishing && sudo -u $APP_USER npm ci --omit=dev"
  echo "  sudo systemctl start netliveness-phishing"
fi
