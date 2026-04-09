@echo off
title NETLIVENESS - FULL SYSTEM STARTUP
color 0A
cls

echo ==============================================================
echo [ SISTEM ] NetLiveness Tum Servisler Baslatiliyor...
echo ==============================================================

:: API Servisini Yeni Pencerede Baslat
echo [ 1/2 ] API (Web Arayuzu) yukleniyor...
start "NetLiveness API" cmd /c "cd c:\Users\mgude\.gemini\antigravity\scratch\NetLiveness.Api && dotnet run --urls http://0.0.0.0:5006"

echo [ BEKLE ] API'nin hazirlanmasi icin 5 saniye bekleniyor...
timeout /t 5 > nul

:: MonitorWorker Servisini Yeni Pencerede Baslat
echo [ 2/2 ] MonitorWorker (Izleme Servisi) yukleniyor...
start "NetLiveness MONITOR" cmd /c "cd c:\Users\mgude\.gemini\antigravity\scratch\NetLiveness.MonitorWorker && dotnet run"

echo.
echo ==============================================================
echo [ BASARILI ] Tum sistemler devrede!
echo.
echo [ NOT ] Arka plandaki siyah pencereleri kapatmayiniz. 
echo [ NOT ] Eger bir pencere kapanirsa otomatik olarak tekrar acilacaktir.
echo ==============================================================
echo [ CIKIS ] Bu pencereyi kapatabilirsiniz. Servisler arka planda acildi.
pause
