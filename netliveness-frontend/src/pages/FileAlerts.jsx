import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFileAlerts, deleteFileAlert, getTerminals, getUserActivityTargets } from '../api';
import { 
  Search, TriangleAlert, RefreshCw, Trash2, Calendar, HardDrive, 
  ChevronRight, Download, Filter, User, CircleAlert, Monitor, 
  ShieldCheck, ShieldAlert, Cpu, Activity, Clock, AlertOctagon,
  ChevronDown, ChevronUp, Database, FileText, Globe, Server, List,
  ArrowRight, Info, CheckCircle2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FileAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [monitoringTargets, setMonitoringTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPc, setSelectedPc] = useState(null);
  const [extensionFilter, setExtensionFilter] = useState('');

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
      
      // İlk yüklemede uyarısı olan ilk PC'yi seç
      if (!selectedPc && targetData.length > 0) {
        const firstWithAlerts = targetData.find(t => alertData.some(a => a.pcName === t.pcName));
        setSelectedPc(firstWithAlerts ? firstWithAlerts.pcName : targetData[0].pcName);
      }
    } catch (e) {
      console.error(e);
      toast.error('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [selectedPc]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteFileAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Kayıt silindi.');
    } catch (e) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchPc = !selectedPc || a.pcName === selectedPc;
      const matchSearch = !search || a.fileName?.toLowerCase().includes(search.toLowerCase()) || a.filePath?.toLowerCase().includes(search.toLowerCase());
      const matchExt = !extensionFilter || a.extension?.toLowerCase() === extensionFilter.toLowerCase();
      return matchPc && matchSearch && matchExt;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [alerts, selectedPc, search, extensionFilter]);

  const currentTerminal = terminals.find(t => t.name === selectedPc);
  const extensions = [...new Set(alerts.map(a => a.extension?.toLowerCase()))].filter(Boolean).sort();

  if (loading && alerts.length === 0) return <div className="loading-spinner"><div className="spinner" /> Veriler Yükleniyor...</div>;

  return (
    <div className="animate-fade-in" style={{ 
      height: 'calc(100vh - 120px)', 
      display: 'flex', 
      gap: '24px',
      overflow: 'hidden'
    }}>
      {/* --- SOL PANEL: CIHAZ LİSTESİ --- */}
      <div className="glass-card" style={{ 
        width: '320px', 
        display: 'flex', 
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor size={20} className="text-accent" /> Cihazlar
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>İzlenen terminaller ve durumlar</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {monitoringTargets.map(target => {
            const term = terminals.find(t => t.name === target.pcName);
            const pcAlerts = alerts.filter(a => a.pcName === target.pcName);
            const isActive = selectedPc === target.pcName;
            const hasError = term?.lastError != null;

            return (
              <div 
                key={target.pcName}
                onClick={() => setSelectedPc(target.pcName)}
                className={`terminal-list-item ${isActive ? 'active' : ''}`}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  background: isActive ? 'linear-gradient(135deg, var(--accent-green) 0%, #15803d 100%)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--border-color)'}`,
                  boxShadow: isActive ? '0 10px 20px rgba(34, 197, 129, 0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderLeft: isActive ? '6px solid white' : '1px solid transparent'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.03)',
                  display: 'grid', placeItems: 'center', color: isActive ? 'white' : 'var(--text-muted)'
                }}>
                  <Server size={20} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: isActive ? 900 : 700, fontSize: '15px', color: isActive ? 'white' : 'var(--text-primary)' }}>{target.pcName}</div>
                  <div style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.8)' : (hasError ? '#ef4444' : 'var(--text-muted)'), display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {hasError ? <AlertOctagon size={10} /> : <div style={{width:6, height:6, borderRadius:'50%', background: term?.status === 'UP' ? (isActive ? 'white' : 'var(--accent-green)') : '#94a3b8'}} />}
                    {hasError ? 'Bağlantı Hatası' : (term?.status === 'UP' ? 'Aktif' : 'Çevrimdışı')}
                  </div>
                </div>

                {pcAlerts.length > 0 && (
                  <div style={{ 
                    padding: '2px 8px', borderRadius: '10px', background: '#ef4444', 
                    color: 'white', fontSize: '10px', fontWeight: 900 
                  }}>
                    {pcAlerts.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SAĞ PANEL: DETAY AKIŞI --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        
        {/* PC Header Info */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-green)', color: 'white', display: 'grid', placeItems: 'center' }}>
                <Activity size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 900 }}>{selectedPc} - Aktivite Akışı</h2>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {currentTerminal?.lastUserName || '---'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Son Tarama: {currentTerminal?.lastActivityTime ? new Date(currentTerminal.lastActivityTime).toLocaleTimeString('tr-TR') : '---'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="search-box" style={{ width: '240px' }}>
                <Search size={16} />
                <input placeholder="Dosya adı ara..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="filter-select" style={{ width: '140px' }} value={extensionFilter} onChange={e => setExtensionFilter(e.target.value)}>
                <option value="">Tüm Uzantılar</option>
                {extensions.map(ext => <option key={ext} value={ext}>.{ext.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {currentTerminal?.lastError && (
            <div style={{ 
              marginTop: '16px', padding: '12px 16px', borderRadius: '12px', 
              background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
              display: 'flex', gap: '12px', alignItems: 'center', color: '#ef4444'
            }}>
              <ShieldAlert size={20} />
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{currentTerminal.lastError}</div>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: '#ef4444' }} onClick={load}>Tekrar Dene</button>
            </div>
          )}
        </div>

        {/* Timeline Akışı */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          <div className="timeline-container" style={{ position: 'relative', paddingLeft: '32px' }}>
            <div style={{ position: 'absolute', left: '15px', top: '0', bottom: '0', width: '2px', background: 'var(--border-color)', opacity: 0.5 }} />
            
            {filteredAlerts.length > 0 ? filteredAlerts.map((alert, idx) => {
              const mb = alert.fileSize / (1024 * 1024);
              const isCritical = mb > 500;
              const isHigh = mb > 100;

              return (
                <div key={alert.id} className="timeline-item animate-slide-up" style={{ 
                  marginBottom: '20px', 
                  position: 'relative',
                  animationDelay: `${idx * 0.05}s`
                }}>
                  {/* Timeline Node */}
                  <div style={{ 
                    position: 'absolute', left: '-25px', top: '24px', 
                    width: '18px', height: '18px', borderRadius: '50%', 
                    background: isCritical ? '#ef4444' : isHigh ? '#f59e0b' : 'var(--accent-green)',
                    border: '4px solid var(--bg-primary)',
                    boxShadow: '0 0 0 4px var(--bg-hover)'
                  }} />

                  <div className="glass-card hover-glow" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ display: 'flex' }}>
                      {/* Sol İkon Bölümü */}
                      <div style={{ 
                        width: '70px', background: 'rgba(255,255,255,0.02)', 
                        display: 'grid', placeItems: 'center', borderRight: '1px solid var(--border-color)' 
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <FileText size={24} style={{ color: isCritical ? '#ef4444' : 'var(--text-muted)' }} />
                          <div style={{ fontSize: '9px', fontWeight: 900, marginTop: '4px', textTransform: 'uppercase' }}>{alert.extension}</div>
                        </div>
                      </div>

                      {/* Ana İçerik */}
                      <div style={{ flex: 1, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ fontSize: '16px', fontWeight: 800 }}>{alert.fileName}</h4>
                              {isCritical && <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 900 }}>KRİTİK BOYUT</span>}
                            </div>
                            <div style={{ 
                              fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', 
                              wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' 
                            }}>
                              <Globe size={12} /> {alert.filePath}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: isCritical ? '#ef4444' : 'inherit' }}>{mb.toFixed(1)} MB</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <Clock size={12} /> {new Date(alert.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Boyut Barı */}
                        <div style={{ marginTop: '12px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${Math.min(100, (mb / 1000) * 100)}%`, 
                            height: '100%', 
                            background: isCritical ? '#ef4444' : isHigh ? '#f59e0b' : 'var(--accent-green)',
                            transition: 'width 1s ease-out'
                          }} />
                        </div>
                      </div>

                      {/* İşlem Butonları */}
                      <div style={{ width: '60px', display: 'grid', placeItems: 'center' }}>
                        <button className="btn-icon" onClick={() => handleDelete(alert.id)} style={{ opacity: 0.4 }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '100px 0', textAlign: 'center', opacity: 0.3 }}>
                <CheckCircle2 size={48} style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Temiz Akış</h3>
                <p>Bu cihazda yakalanan kritik bir dosya hareketi bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
