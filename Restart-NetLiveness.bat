@echo off
set "ROOT=%~dp0"
echo NetLiveness servisleri kapatiliyor...
taskkill /IM "dotnet.exe" /F 2>nul
taskkill /IM "NetLiveness.Api.exe" /F 2>nul
taskkill /IM "NetLiveness.MonitorWorker.exe" /F 2>nul
timeout /t 2 /nobreak >nul

echo API baslatiliyor...
cd /d "%ROOT%NetLiveness.Api"
start "NetLiveness Web API" cmd /k "dotnet run"

echo Monitor Worker baslatiliyor...
cd /d "%ROOT%NetLiveness.MonitorWorker"
start "NetLiveness Monitor Worker" cmd /k "dotnet run"

echo.
echo Sistem yeniden baslatildi. Bu pencereleri kapatmayin.
pause
