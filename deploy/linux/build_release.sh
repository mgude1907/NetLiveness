#!/usr/bin/env bash
# NetLiveness Linux yayın paketi oluşturur (geliştirme makinesinde veya WSL'de).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT="$ROOT/dist/linux"
RID="${NETLIVENESS_RID:-linux-x64}"

echo "==> Derleme çıktısı: $OUT (RID=$RID)"

rm -rf "$OUT"
mkdir -p "$OUT/api" "$OUT/worker" "$OUT/phishing"

echo "==> Frontend (Vite)"
cd "$ROOT/netliveness-frontend"
if [[ ! -d node_modules ]]; then
  npm ci
fi
npm run build

WWW="$ROOT/NetLiveness.Api/wwwroot"
mkdir -p "$WWW/uploads"
rsync -a --delete --exclude uploads/ "$ROOT/netliveness-frontend/dist/" "$WWW/"

echo "==> API"
cd "$ROOT/NetLiveness.Api"
dotnet publish -c Release -r "$RID" --self-contained true -o "$OUT/api" /p:PublishSingleFile=false

echo "==> Monitor Worker"
cd "$ROOT/NetLiveness.MonitorWorker"
dotnet publish -c Release -r "$RID" --self-contained true -o "$OUT/worker" /p:PublishSingleFile=false

echo "==> Phishing sunucusu (kaynak)"
rsync -a --exclude node_modules/ "$ROOT/netliveness-phishing-server/" "$OUT/phishing/"

echo "==> systemd unit dosyaları"
mkdir -p "$OUT/systemd"
cp "$SCRIPT_DIR/systemd/"*.service "$OUT/systemd/"

echo "==> Tamamlandı: $OUT"
