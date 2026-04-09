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
echo "1/3 API Derleniyor ve BaÅŸlatÄ±lÄ±yor (Port 5006)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$apiDir'; dotnet build; dotnet run --no-build" -WindowStyle Normal

# 3. Start Monitor Worker
echo "2/3 Monitor Worker Derleniyor ve BaÅŸlatÄ±lÄ±yor..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$workerDir'; dotnet build; dotnet run --no-build" -WindowStyle Minimized

# 4. Start Frontend
echo "3/3 Frontend Başlatılıyor (Port 5173)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontDir'; npm run dev" -WindowStyle Normal

echo "--- Tüm Servisler Başlatıldı ---"
