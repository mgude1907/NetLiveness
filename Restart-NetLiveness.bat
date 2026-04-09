@echo off
echo NetLiveness Tum Servisler (API ve İzleme) Kapatiliyor...
taskkill /IM "dotnet.exe" /F
taskkill /IM "NetLiveness.Api.exe" /F
taskkill /IM "NetLiveness.MonitorWorker.exe" /F
timeout /t 2

echo NetLiveness Web API Başlatılıyor...
cd C:\Users\mgude\.gemini\antigravity\scratch\NetLiveness.Api
start "NetLiveness Web API" cmd /k "dotnet run"

echo NetLiveness İzleme Servisi Başlatılıyor...
cd C:\Users\mgude\.gemini\antigravity\scratch\NetLiveness.MonitorWorker
start "NetLiveness İzleme Servisi" cmd /k "dotnet run"

echo.
echo Sistem Yeniden Başlatıldı. Lütfen bu siyah ekranları KAPATMAYIN...
pause
