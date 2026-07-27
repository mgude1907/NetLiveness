# NetLiveness Master Launcher (yerel geliştirme)

$baseDir = $PSScriptRoot
$apiDir = Join-Path $baseDir 'NetLiveness.Api'
$workerDir = Join-Path $baseDir 'NetLiveness.MonitorWorker'
$frontDir = Join-Path $baseDir 'netliveness-frontend'

powershell.exe -ExecutionPolicy Bypass -File (Join-Path $baseDir 'cleanup.ps1')

Write-Host '--- NetLiveness başlatılıyor ---'

Write-Host '1/4 API (port 5006)...'
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$apiDir'; dotnet build; dotnet run --no-build"

Write-Host '2/4 Monitor Worker...'
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$workerDir'; dotnet build; dotnet run --no-build" -WindowStyle Minimized

$phishingDir = Join-Path $baseDir 'netliveness-phishing-server'
Write-Host '3/4 Phishing sunucusu (port 3001)...'
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$phishingDir'; node server.js"

Write-Host '4/4 Frontend (port 5137)...'
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$frontDir'; npm run dev"

Write-Host '--- Tüm servisler başlatıldı ---'
