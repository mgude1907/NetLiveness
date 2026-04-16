# NetLiveness Master Launcher
# Ensure absolute paths for stability.

$baseDir = "C:\Users\mgude\.gemini\antigravity\scratch"
$apiDir = Join-Path $baseDir "NetLiveness.Api"
$workerDir = Join-Path $baseDir "NetLiveness.MonitorWorker"
$frontDir = Join-Path $baseDir "netliveness-frontend"

# 1. Clean up first
powershell.exe -ExecutionPolicy Bypass -File "$baseDir\cleanup.ps1"

echo "--- NetLiveness Başlatılıyor ---"

# 2. Start API
echo "1/4 API Derleniyor ve Başlatılıyor (191.168.6.101:5006)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$apiDir'; dotnet build; dotnet run --no-build" -WindowStyle Normal

# 3. Start Monitor Worker
echo "2/4 Monitor Worker Derleniyor ve Başlatılıyor..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$workerDir'; dotnet build; dotnet run --no-build" -WindowStyle Minimized

# 4. Start Phishing Server
$phishingDir = Join-Path $baseDir "netliveness-phishing-server"
echo "3/4 Phishing Sunucusu Başlatılıyor (Port 3001)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$phishingDir'; node server.js" -WindowStyle Normal

# 5. Start Frontend
echo "4/4 Frontend Başlatılıyor (191.168.6.101:5137)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontDir'; npm run dev" -WindowStyle Normal

echo "--- Tüm Servisler Başlatıldı ---"
