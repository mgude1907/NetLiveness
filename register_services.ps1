# NetLiveness Windows Servis Kayıt Betiği
# Bu betik API ve Worker bileşenlerini Windows Servisi olarak sisteme ekler.

$setupDir = "C:\Users\mgude\.gemini\antigravity\scratch\NetLiveness_Setup"
$apiPath = "$setupDir\Backend\NetLiveness.Api.exe"
$workerPath = "$setupDir\Worker\NetLiveness.MonitorWorker.exe"

# 1. API Servisini Oluştur
echo "API Servisi Oluşturuluyor..."
sc.exe create NetLiveness_API binPath= "$apiPath" start= auto displayname= "NetLiveness API Service"
sc.exe description NetLiveness_API "NetLiveness Sistemi Ana Veri ve Kontrol API Servisi"
sc.exe failure NetLiveness_API reset= 86400 actions= restart/60000/restart/60000/restart/60000

# 2. Worker Servisini Oluştur
echo "Worker Servisi Oluşturuluyor..."
sc.exe create NetLiveness_Worker binPath= "$workerPath" start= auto displayname= "NetLiveness Worker Service"
sc.exe description NetLiveness_Worker "NetLiveness Ağ İzleme ve Veri Toplama Servisi"
sc.exe failure NetLiveness_Worker reset= 86400 actions= restart/60000/restart/60000/restart/60000

echo "--- Servis Kaydı Tamamlandı ---"
echo "Servisleri başlatmak için: 'sc.exe start NetLiveness_API' ve 'sc.exe start NetLiveness_Worker'"
