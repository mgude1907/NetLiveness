import React, { useState, useEffect, useCallback } from 'react';
import { getFileAlerts, deleteFileAlert, getTerminals, getUserActivityTargets } from '../api';
import { 
  Search, TriangleAlert, RefreshCw, Trash2, Calendar, HardDrive, 
  ChevronRight, Download, Filter, User, CircleAlert, Monitor, ShieldCheck, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FileAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [monitoringTargets, setMonitoringTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [extensionFilter, setExtensionFilter] = useState('');
  const [pcFilter, setPcFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const [alertData, termData, targetData] = await Promise.all([
        getFileAlerts(),
        getTerminals(),
        getUserActivityTargets()
      ]);
      setAlerts(alertData || []);
      setTerminals(termData || []);
      setMonitoringTargets(targetData || []);
    } catch (e) {
      console.error(e);
      toast.error('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu uyarıyı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteFileAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Uyarı silindi.');
    } catch (e) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const pcs = monitoringTargets.map(t => t.pcName).sort();
  const extensions = [...new Set(alerts.map(a => a.extension?.toLowerCase()))].filter(Boolean).sort();

  const filtered = alerts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.fileName?.toLowerCase().includes(q) || a.filePath?.toLowerCase().includes(q);
    const matchExt = !extensionFilter || a.extension?.toLowerCase() === extensionFilter.toLowerCase();
    const matchPc = !pcFilter || a.pcName === pcFilter;
    return matchSearch && matchExt && matchPc;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /> Veriler Yükleniyor...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <TriangleAlert size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Kritik Dosya Hareketleri</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>CAD ve mühendislik dosyalarının yüksek boyutlu transferleri</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={() => { setLoading(true); load(); }}>
            <RefreshCw size={18} /> Yenile
          </button>
          <button className="btn btn-primary" onClick={() => {
            const csv = [
              ['Tarih', 'PC', 'Dosya', 'Yol', 'Boyut (MB)', 'Uzantı'],
              ...filtered.map(a => [
                new Date(a.timestamp).toLocaleString('tr-TR'),
                a.pcName,
                a.fileName,
                a.filePath,
                (a.fileSize / (1024 * 1024)).toFixed(2),
                a.extension
              ])
            ].map(row => row.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `kritik-dosya-hareketleri-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
          }}>
            <Download size={18} /> Dışa Aktar (CSV)
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px', border: '1px solid rgba(34, 197, 129, 0.2)', background: 'rgba(34, 197, 129, 0.02)' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ color: 'var(--accent-green)' }}><CircleAlert size={24} /></div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '8px', color: 'var(--accent-green)' }}>Nasıl Uyarı Oluşturulur?</h4>
            <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', paddingLeft: '18px' }}>
              <li><b>1. Cihazı Yapılandırın:</b> "Ağ İzleme" sayfasından ilgili bilgisayarı düzenleyin.</li>
              <li><b>2. İzlemeyi Etkinleştirin:</b> "⚠️ Kritik Dosya İzlemeyi Aç" kutusunu işaretleyin.</li>
              <li><b>3. Klasör ve Uzantı:</b> İzlenecek yolları ve uzantıları (Örn: <code style={{background:'rgba(255,255,255,0.05)', padding:'2px 4px'}}>sldprt;dwg;zip</code>) belirleyip kaydedin.</li>
              <li><b>4. Test Edin:</b> Belirlediğiniz boyuttan (MB) büyük bir dosyayı o klasöre kopyalayın. Sistem 5 dakika içinde uyaracaktır.</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={14} /> Kullanıcı İzleme Hedefleri (Bilgisayarlar)
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
          {monitoringTargets.filter(t => t && t.pcName).map(target => {
            const terminal = terminals.find(t => t && t.name && t.name.toLowerCase() === target.pcName.toLowerCase());
            const hasAlert = alerts.some(a => a.pcName && a.pcName.toLowerCase() === target.pcName.toLowerCase());
            const isMonitored = terminal?.enableFileMonitoring === true;
            const isOnline = terminal?.status === 'UP';

            return (
              <div key={target.id || target.pcName} style={{ 
                minWidth: '200px', padding: '12px', borderRadius: '12px', 
                background: isMonitored ? 'rgba(34, 197, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isMonitored ? 'rgba(34, 197, 129, 0.2)' : 'var(--border-color)'}`,
                cursor: 'pointer', opacity: terminal ? 1 : 0.5
              }} onClick={() => setPcFilter(pcFilter === target.pcName ? '' : target.pcName)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px' }}>{target.pcName}</span>
                  {isMonitored ? <ShieldCheck size={14} style={{ color: 'var(--accent-green)' }} /> : <ShieldAlert size={14} style={{ color: 'var(--text-muted)' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  {terminal ? (
                    <>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? 'var(--accent-green)' : '#ef4444' }} />
                      {isOnline ? 'Aktif' : 'Çevrimdışı'}
                    </>
                  ) : (
                    <span>Konfigüre Edilmemiş</span>
                  )}
                  {hasAlert && <span style={{ marginLeft: 'auto', color: '#ef4444', fontWeight: 800 }}>⚠️ Alert</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div className="search-box" style={{ flex: '1 1 300px' }}>
          <Search size={18} />
          <input 
            placeholder="Dosya adı veya yol ara..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flex: '1 1 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <HardDrive size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              className="filter-select" 
              style={{ border: 'none', background: 'transparent' }}
              value={pcFilter} 
              onChange={e => setPcFilter(e.target.value)}
            >
              <option value="">Tüm Bilgisayarlar</option>
              {pcs.map(pc => <option key={pc} value={pc}>{pc}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              className="filter-select" 
              style={{ border: 'none', background: 'transparent' }}
              value={extensionFilter} 
              onChange={e => setExtensionFilter(e.target.value)}
            >
              <option value="">Tüm Uzantılar</option>
              {extensions.map(ext => <option key={ext} value={ext}>.{ext.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="stats-mini">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>SONUÇLAR</div>
          <div style={{ fontSize: '16px', fontWeight: 800 }}>{filtered.length}</div>
        </div>
      </div>

      <div className="table-container animate-slide-up">
        <table className="data-table">
          <thead>
            <tr>
              <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> Tarih / Zaman</div></th>
              <th><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={14} /> Bilgisayar</div></th>
              <th>Dosya Bilgisi</th>
              <th>Boyut</th>
              <th>Uzantı</th>
              <th style={{ width: '80px' }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(alert => (
              <tr key={alert.id} className={alert.fileSize > 100 * 1024 * 1024 ? 'status-critical' : ''}>
                <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {new Date(alert.timestamp).toLocaleString('tr-TR')}
                </td>
                <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                  {alert.pcName}
                </td>
                <td>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '2px' }}>{alert.fileName}</div>
                  <div style={{ 
                    fontSize: '11px', color: 'var(--text-muted)', 
                    maxWidth: '400px', whiteSpace: 'nowrap', 
                    overflow: 'hidden', textOverflow: 'ellipsis' 
                  }}>
                    {alert.filePath}
                  </div>
                </td>
                <td>
                  <span style={{ 
                    fontWeight: 800, 
                    color: alert.fileSize > 50 * 1024 * 1024 ? '#ef4444' : 'var(--text-primary)' 
                  }}>
                    {(alert.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </td>
                <td>
                  <span className="badge badge-ghost" style={{ fontWeight: 800 }}>
                    {alert.extension?.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-icon btn-danger-ghost" 
                    title="Uyarısını Sil"
                    onClick={() => handleDelete(alert.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '80px 0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.3 }}>
                    <CircleAlert size={48} />
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>Kritik dosya hareketi bulunamadı.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
