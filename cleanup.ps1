# NetLiveness Cleanup Script
# This script kills any orphan processes that might be locking the database or files.

echo "--- NetLiveness Temizlik Başlatılıyor ---"

# Kill by Process Name
$processes = @("NetLiveness.Api", "NetLiveness.MonitorWorker", "dotnet")
foreach ($p in $processes) {
    try {
        Stop-Process -Name $p -Force -ErrorAction SilentlyContinue
        echo "Durduruldu: $p"
    } catch { }
}

# Kill by Port (5006 for API, 5173 for Vite)
$ports = @(5006, 5173)
foreach ($port in $ports) {
    try {
        $procId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
        if ($procId) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            echo "Port $port kullanan işlem durduruldu (PID: $procId)"
        }
    } catch { }
}

echo "--- Temizlik Tamamlandı ---"
