import { useState, useEffect, useCallback } from 'react';
import { checkForUpdates, getUpdateHistory, installUpdate } from '../api';
import { DownloadCloud, History, CircleCheck, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Updates() {
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [installing, setInstalling] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getUpdateHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await checkForUpdates();
      setUpdateInfo(res);
      if (res.hasUpdate) {
        toast.success(`Yeni bir sürüm mevcut: ${res.latestVersion}`);
      } else {
        toast.success('Sisteminiz güncel.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Güncellemeler kontrol edilemedi.');
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!updateInfo || !updateInfo.hasUpdate) return;
    
    if (window.confirm(`${updateInfo.latestVersion} sürümü kurulacak. API sunucusu otomatik olarak yeniden başlatılacak. Emin misiniz?`)) {
      setInstalling(true);
      try {
        const res = await installUpdate({
          latestVersion: updateInfo.latestVersion,
          downloadUrl: updateInfo.downloadUrl,
          changelog: updateInfo.changelog
        });
        toast.success(res.message || 'Güncelleme başlatıldı. Sistem yeniden başlıyor...');
        
        // Simüle edilmiş bir bekleme ve sayfayı yenileme (Sunucu gidip geleceği için)
        setTimeout(() => {
          window.location.reload();
        }, 8000);

      } catch (e) {
        console.error(e);
        toast.error('Güncelleme başlatılamadı.');
        setInstalling(false);
      }
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /> Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Sistem Güncellemeleri</h2>
          <p>Yazılım sürümünü kontrol edin ve yeni çıkan özellikleri kurun.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Sol Taraf: Güncelleme Kontrol Kartı */}
        <div className="card" style={{ flex: '1 1 400px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <DownloadCloud size={20} color="var(--accent-blue)" /> Güncelleme Merkezi
          </h3>
          
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Mevcut Sürüm</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{updateInfo ? updateInfo.currentVersion : 'v1.0.0'}</div>
            </div>
            
            <button 
              className="btn btn-secondary" 
              onClick={handleCheck} 
              disabled={checking || installing}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {checking ? 'Kontrol Ediliyor...' : 'Güncellemeleri Kontrol Et'}
            </button>
          </div>

          {updateInfo && updateInfo.hasUpdate && (
            <div style={{ 
              border: '1px solid var(--accent-green)', borderRadius: '12px', padding: '20px', 
              background: 'rgba(34, 197, 94, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-green)', fontWeight: 'bold', marginBottom: '16px' }}>
                <CircleCheck size={20} /> Yeni Sürüm Tespit Edildi: {updateInfo.latestVersion}
              </div>
              
              <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                <strong>Yenilikler / Değişiklikler:</strong>
                <ul style={{ marginTop: '10px', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                  {updateInfo.changelog.map((log, i) => <li key={i} style={{ marginBottom: '6px' }}>{log}</li>)}
                </ul>
              </div>
              
              <button 
                className="btn btn-primary" 
                onClick={handleInstall} 
                disabled={installing}
                style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-green)' }}
              >
                {installing ? 'İndiriliyor ve Kuruluyor (Lütfen Bekleyin)...' : 'Şimdi Kur ve Yeniden Başlat'}
              </button>
              
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <TriangleAlert size={12} /> Güncelleme sırasında sistem kısa süreliğine çevrimdışı olacaktır.
              </p>
            </div>
          )}

          {updateInfo && !updateInfo.hasUpdate && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              Sisteminiz tamamen güncel. Yeni bir paket bulunamadı.
            </div>
          )}
        </div>

        {/* Sağ Taraf: Geçmiş Güncellemeler */}
        <div className="card" style={{ flex: '1 1 400px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <History size={20} color="var(--text-secondary)" /> Güncelleme Geçmişi (Changelog)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                Henüz sisteme kaydedilmiş bir güncelleme bulunmuyor.
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} style={{ 
                  padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', 
                  borderLeft: '4px solid var(--accent-purple)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>{item.version} Paneli</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(item.dateInstalled).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {item.description}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
