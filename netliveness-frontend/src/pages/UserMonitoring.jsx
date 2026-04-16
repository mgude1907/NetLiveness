import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import {
  getUserActivityTargets,
  addUserActivityTarget,
  deleteUserActivityTarget,
  getUserActivitySummary,
  getUserWebSummary,
  getUserDetailedStats,
  forcePollUserActivity,
  getFileAlerts,
  deleteFileAlert,
  forceScanFiles,
  getTerminals,
  createTerminal,
  updateTerminal,
  deleteTerminal,
  forceWmiRefresh,
  getSettings,
  getInventory
} from '../api';
import {
  Monitor, Clock, Activity, Globe, LayoutDashboard, RefreshCw, Zap, CircleAlert, Settings2, Plus, Trash2, X, TriangleAlert, Search, Pencil, User, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import GlobalMonitoringDashboard from './GlobalMonitoringDashboard';

const COLORS = ['#22c55e', '#10b981', '#059669', '#0d9488', '#0f766e', '#14b8a6', '#2dd4bf', '#5eead4'];

export default function UserMonitoring() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const navigate = useNavigate();

  // --- COMPUTER MANAGEMENT STATES --- //
  const [compItems, setCompItems]     = useState([]);
  const [compSearch, setCompSearch]   = useState('');
  const [compModal, setCompModal]     = useState(false);
  const [compDeleteModal, setCompDeleteModal] = useState(false);
  const [compForm, setCompForm]       = useState({
    name: '', host: '', deviceType: 'PC', company: 'Merkez',
    username: '', password: '', 
    enableFileMonitoring: false, monitoredPaths: 'C:\\Users', monitoredExtensions: 'sldprt;dwg;dxf;step;iam;ipt', fileThresholdMb: 25,
    enableUserActivity: true, userActivityGroup: 'Genel'
  });
  const [compEditId, setCompEditId]   = useState(null);
  const [firmsList, setFirmsList]     = useState([]);

  // --- INVENTORY LOOKUP --- //
  const [inventory, setInventory]     = useState([]);
  const [showStockSelect, setShowStockSelect] = useState(false);
  const [stockSearch, setStockSearch] = useState('');

  // --- ACTIVITY MONITORING STATES --- //
  const [targets, setTargets]         = useState([]);
  const [selectedPc, setSelectedPc]   = useState('');
  const [appSummary, setAppSummary]   = useState([]);
  const [webSummary, setWebSummary]   = useState([]);
  const [detailedStats, setDetailedStats] = useState(null);
  const [fileAlerts, setFileAlerts]   = useState([]);

  const loadTargets = useCallback(async () => {
    try {
      const data = await getUserActivityTargets();
      setTargets(data);
      if (data.length > 0 && !selectedPc) {
        setSelectedPc(data[0].pcName);
      }
    } catch (e) {
      console.error('Failed to load targets', e);
    }
  }, [selectedPc]);

  const loadComputers = useCallback(async () => {
    try { 
      const [termData, settingsData] = await Promise.all([getTerminals(), getSettings()]);
      const pcs = (termData || []).filter(t => {
        const isPc = t.deviceType?.toUpperCase() === 'PC';
        const isUserMon = !!t.enableUserActivity;
        const isLocal = t.name?.toLowerCase().includes('localhost') || t.host?.toLowerCase().includes('127.0.0.1');
        return isPc || isUserMon || isLocal;
      });
      setCompItems(pcs);
      const firms = (settingsData?.firmsList || '').split(',').map(f => f.trim()).filter(Boolean);
      setFirmsList(firms.length > 0 ? firms : ['Merkez']);
    } catch (e) { console.error('Failed to load computers', e); }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const { getInventory, getStock } = await import('../api');
      const [inv, stock] = await Promise.all([getInventory(), getStock()]);
      const combined = [...(inv || []), ...(stock || [])];
      setInventory(combined.filter(i => i.category === 'Bilgisayar'));
    } catch (e) { console.error('Failed to load inventory', e); }
  }, []);

  const handleSaveComp = async () => {
    try {
      const payload = { ...compForm, deviceType: 'PC' };
      if (compEditId) {
        await updateTerminal(compEditId, { ...payload, id: compEditId });
        toast.success('Bilgisayar güncellendi.');
      } else {
        await createTerminal(payload);
        toast.success('Yeni bilgisayar eklendi.');
      }
      setCompModal(false); loadComputers(); loadTargets();
    } catch (e) { toast.error('Kayıt başarısız oldu.'); }
  };

  const handleDeleteComp = async () => {
    try {
      await deleteTerminal(compEditId);
      toast.success('Bilgisayar silindi.');
      setCompDeleteModal(false); loadComputers(); loadTargets();
    } catch (e) { toast.error('Silme başarısız oldu.'); }
  };

  const handleRefreshWMI = async (id, e) => {
    if (e) e.stopPropagation();
    const tid = toast.loading('Tarama yapılıyor...');
    try {
      await forceWmiRefresh(id);
      toast.success('Yenilendi.', { id: tid });
      loadComputers();
    } catch (e) { toast.error('Hata oluştu.', { id: tid }); }
  };

  const openNewComp = () => { 
    setCompForm({
      name: '', host: '', deviceType: 'PC', company: 'Merkez',
      username: '', password: '', 
      enableFileMonitoring: false, monitoredPaths: 'C:\\Users', monitoredExtensions: 'sldprt;dwg;dxf;step;iam;ipt', fileThresholdMb: 25,
      enableUserActivity: true, userActivityGroup: 'Genel'
    }); 
    setCompEditId(null); setCompModal(true); 
    loadInventory();
  };

  const handleStockSelect = (item) => {
    setCompForm(prev => ({
      ...prev,
      name: item.pcIsmi || '',
      host: item.ipAddress || item.pcIsmi || '', // IP varsa al, yoksa PC ismi
      company: item.firma || 'Merkez',
      description: `${item.brand || ''} ${item.model || ''} (${item.serialNo || ''})`.trim()
    }));
    setShowStockSelect(false);
    toast.success('Bilgiler stoktan çekildi.');
  };
  const openEditComp = (t) => { setCompForm({ ...t }); setCompEditId(t.id); setCompModal(true); };

  useEffect(() => { 
    loadTargets();
    loadComputers();
    const iv = setInterval(() => {
        loadTargets();
        loadComputers();
    }, 15000);
    return () => clearInterval(iv);
  }, [loadTargets, loadComputers]);
  const loadData = useCallback(async (pc) => {
    if (!pc || pc === 'ALL') {
      try {
        const alerts = await getFileAlerts();
        setFileAlerts(alerts || []);
      } catch (e) {
        console.error('Failed to load global file alerts', e);
      }
      return;
    }
    setRefreshing(true);
    try {
      const [apps, web, stats, alerts] = await Promise.all([
        getUserActivitySummary(pc),
        getUserWebSummary(pc),
        getUserDetailedStats(pc),
        getFileAlerts()
      ]);
      setAppSummary(apps || []);
      setWebSummary(web || []);
      setDetailedStats(stats);
      setFileAlerts(alerts || []);
    } catch (e) {
      console.error('Failed to load activity data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleManualPoll = async () => {
    if (!selectedPc) return;
    setRefreshing(true);
    const tid = toast.loading(`${selectedPc} cihazından veri çekiliyor...`);
    try {
      const result = await forcePollUserActivity(selectedPc);
      if (result.count > 0) {
        toast.success(result.message || 'Veriler başarıyla güncellendi.', { id: tid });
      } else {
        toast.error('Yeni veri bulunamadı. Cihaz kapalı veya WMI erişimi engellenmiş olabilir.', { id: tid });
      }
      await loadData(selectedPc);
    } catch (e) {
      toast.error('Veri çekme başarısız: ' + (e.response?.data?.message || e.message), { id: tid });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadTargets(); }, [loadTargets]);

  useEffect(() => {
    if (selectedPc) {
      loadData(selectedPc);
      const iv = setInterval(() => loadData(selectedPc), 30000);
      return () => clearInterval(iv);
    }
  }, [selectedPc, loadData]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalAppSeconds = appSummary.reduce((acc, curr) => acc + curr.totalDurationSeconds, 0);
  const totalWebSeconds = webSummary.reduce((acc, curr) => acc + curr.totalSeconds, 0);
  const hasData = appSummary.length > 0;

  if (loading && targets.length === 0) return (
    <div className="loading-spinner"><div className="spinner" /> Yükleniyor...</div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            <div className="icon-box-sm icon-amber"><Activity size={15} /></div>
            İzleme & Yönetim Merkezi
          </h1>
          <p className="page-subtitle">Cihaz yönetimi ve kullanıcı aktiviteleri merkezi operasyon paneli</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {activeTab !== 'devices' && (
            <div className="card" style={{ padding: '4px 8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              {targets.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)' }}>HEDEF:</span>
                  <select
                    className="form-select"
                    value={selectedPc}
                    onChange={(e) => setSelectedPc(e.target.value)}
                    style={{ minWidth: 160, height: '32px', fontSize: '12px', padding: '0 8px' }}
                  >
                    <option value="ALL">Tüm Ofis (Genel)</option>
                    {Object.entries(targets.reduce((acc, t) => {
                      const g = t.group || 'Genel';
                      if (!acc[g]) acc[g] = [];
                      acc[g].push(t);
                      return acc;
                    }, {})).map(([group, groupTargets]) => (
                      <optgroup key={group} label={group}>
                        {groupTargets.map(t => (
                          <option key={t.id} value={t.pcName}>{t.pcName}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}
              <div className="divider-v" style={{ height: '20px' }} />
              <button 
                className="btn btn-ghost" 
                style={{ width: '32px', height: '32px', padding: 0 }} 
                onClick={handleManualPoll} 
                disabled={refreshing || !selectedPc || selectedPc === 'ALL'} 
                title="Cihazdan Anlık Veri Çek"
              >
                <Zap size={14} color="var(--amber)" />
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ width: '32px', height: '32px', padding: 0 }} 
                onClick={() => loadData(selectedPc)} 
                disabled={refreshing}
              >
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="card" style={{ padding: '6px', width: 'fit-content' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'dashboard', label: 'Genel Özet', icon: Activity },
            { id: 'devices', label: 'Bilgisayar Yönetimi', icon: Monitor },
            { id: 'file-alerts', label: 'Dosya Hareketleri', icon: TriangleAlert }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', gap: '8px' }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && <GlobalMonitoringDashboard pcName={selectedPc} />}

      {activeTab === 'devices' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, maxWidth: '400px' }}>
              <Search size={15} color="var(--text-3)" />
              <input placeholder="Bilgisayar, IP veya firma ara..." value={compSearch} onChange={e => setCompSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={openNewComp}><Plus size={16} /> Yeni Bilgisayar</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(compItems.filter(t => {
              const q = compSearch.toLowerCase();
              return !q || t.name.toLowerCase().includes(q) || t.host.toLowerCase().includes(q) || t.company?.toLowerCase().includes(q);
            }).reduce((acc, curr) => {
              const firm = curr.company || 'Tanımsız';
              if (!acc[firm]) acc[firm] = [];
              acc[firm].push(curr);
              return acc;
            }, {})).sort().map(([firm, pcs]) => (
              <div key={firm} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
                   <div className="icon-box-sm icon-blue" style={{ width: 24, height: 24 }}><Building2 size={14} /></div>
                   <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-1)' }}>{firm}</div>
                   <span className="badge badge-neutral" style={{ marginLeft: 'auto', fontSize: '10px' }}>{pcs.length} Bilgisayar</span>
                </div>
                <div style={{ padding: '0' }}>
                   <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: 100 }}>Durum</th>
                          <th>Bilgisayar / Son Kullanıcı</th>
                          <th>Host / IP</th>
                          <th style={{ width: 180 }}>Modüller</th>
                          <th style={{ width: 120, textAlign: 'center' }}>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pcs.map(pc => {
                          const isUp = pc.status === 'UP';
                          const lastUser = pc.lastUserName ? (pc.lastUserName.includes('\\') ? pc.lastUserName.split('\\')[1] : pc.lastUserName) : 'Giriş Yok';
                          return (
                            <tr key={pc.id}>
                              <td>
                                <span className={`badge ${isUp ? 'badge-green' : 'badge-red'}`}>
                                  <span className={`status-dot ${isUp ? 'success pulse' : 'danger'}`} style={{ width: 6, height: 6 }} />
                                  {isUp ? 'AKTİF' : 'KAPALI'}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '13px' }}>{pc.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <User size={10} /> {lastUser}
                                </div>
                              </td>
                              <td style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 500 }}>{pc.host}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {pc.enableUserActivity && <span className="badge badge-neutral" style={{ fontSize: '9px', background: 'var(--bg-inset)' }}>AKTİVİTE</span>}
                                  {pc.enableFileMonitoring && <span className="badge badge-neutral" style={{ fontSize: '9px', background: 'var(--bg-inset)' }}>DOSYA</span>}
                                  {!pc.enableUserActivity && !pc.enableFileMonitoring && <span style={{ fontSize: '10px', color: 'var(--text-3)', fontStyle: 'italic' }}>İzleme Yok</span>}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                   <button className="btn-icon" onClick={(e) => handleRefreshWMI(pc.id, e)} title="WMI Yenile"><RefreshCw size={13} /></button>
                                   <button className="btn-icon" onClick={() => openEditComp(pc)} title="Düzenle"><Pencil size={13} /></button>
                                   <button className="btn-icon" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => { setCompEditId(pc.id); setCompDeleteModal(true); }} title="Sil"><Trash2 size={13} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'file-alerts' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Summary KPIs for Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
              <div className="icon-box-sm icon-red"><TriangleAlert size={16} /></div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase' }}>TOPLAM ALARM</div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>{fileAlerts.length}</div>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
              <div className="icon-box-sm icon-amber"><Clock size={16} /></div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase' }}>SON 24 SAAT</div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>
                  {fileAlerts.filter(a => new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="icon-box-sm icon-slate" style={{ background: 'var(--red-light)', color: 'var(--red)' }}><TriangleAlert size={14} /></div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-1)' }}>KRİTİK DOSYA HAREKETLERİ — {selectedPc === 'ALL' ? 'TÜM OFİS' : selectedPc}</div>
              </div>
              {selectedPc !== 'ALL' && (
                <button 
                  className="btn btn-ghost" 
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={async () => {
                    try {
                      const allTerms = await getTerminals();
                      const target = allTerms.find(t => t.name.toLowerCase() === selectedPc.toLowerCase());
                      if (target) {
                        setRefreshing(true);
                        await forceScanFiles(target.id);
                        toast.success('Tarama başlatıldı.');
                        loadData(selectedPc);
                      }
                    } catch (e) { toast.error('Hata oluştu.'); }
                    finally { setRefreshing(false); }
                  }}
                  disabled={refreshing}
                >
                  <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Şimdi Tara
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Zaman</th>
                    <th>Bilgisayar / Kullanıcı</th>
                    <th style={{ width: 220 }}>Dosya</th>
                    <th>Kaynak Klasör</th>
                    <th style={{ width: 100 }}>Boyut</th>
                    <th style={{ width: 80, textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {fileAlerts.filter(a => selectedPc === 'ALL' || a.pcName.toLowerCase() === selectedPc.toLowerCase()).map(alert => (
                    <tr key={alert.id}>
                      <td style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>{new Date(alert.timestamp).toLocaleString('tr-TR')}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '13px' }}>{alert.pcName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <User size={10} /> {alert.userName || '—'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--red)', fontWeight: 700, fontSize: '13px' }}>{alert.fileName}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>{alert.filePath}</td>
                      <td style={{ fontSize: '12px', fontWeight: 600 }}>{(alert.fileSize / (1024 * 1024)).toFixed(1)} MB</td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                           <button className="btn-icon" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => { if(window.confirm('Kaydı silmek istediğinize emin misiniz?')) { deleteFileAlert(alert.id).then(() => loadData(selectedPc)); } }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fileAlerts.filter(a => selectedPc === 'ALL' || a.pcName.toLowerCase() === selectedPc.toLowerCase()).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ opacity: 0.2, marginBottom: '12px' }}><TriangleAlert size={48} /></div>
                        <p style={{ fontWeight: 600, color: 'var(--text-3)' }}>Herhangi bir şüpheli dosya hareketi saptanmadı.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {compModal && (
        <div className="modal-overlay" onClick={() => setCompModal(false)}>
          <div className="modal-content" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2>
                <div className="icon-box-sm icon-amber"><Monitor size={16} /></div>
                {compEditId ? 'Bilgisayarı Düzenle' : 'Yeni Bilgisayar Kaydı'}
              </h2>
              <button className="icon-btn" onClick={() => setCompModal(false)}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {!compEditId && (
                <div style={{ padding: '12px', background: 'var(--bg-inset)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showStockSelect ? '12px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={14} color="var(--blue)" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>Mevcut Envanterden Veri Çek</span>
                    </div>
                    <button className="btn btn-ghost" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => setShowStockSelect(!showStockSelect)}>
                      {showStockSelect ? 'Kapat' : 'Stoktan Seç'}
                    </button>
                  </div>
                  
                  {showStockSelect && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="search-bar" style={{ height: '36px' }}>
                        <Search size={14} />
                        <input 
                          placeholder="Bilgisayar adı veya seri no ile ara..." 
                          value={stockSearch} 
                          onChange={e => setStockSearch(e.target.value)} 
                          autoFocus
                        />
                      </div>
                      <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {inventory.filter(i => {
                          const s = stockSearch.toLowerCase();
                          return !s || i.pcIsmi?.toLowerCase().includes(s) || i.serialNo?.toLowerCase().includes(s) || (i.assignedTo && i.assignedTo.toLowerCase().includes(s));
                        }).map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => handleStockSelect(item)}
                            style={{ 
                              padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff'
                            }}
                            className="stock-item-hover"
                          >
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>{item.pcIsmi}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.brand} {item.model} — {item.assignedTo || 'Depo'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--blue)' }}>{item.ipAddress || 'IP Yok'}</div>
                               <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{item.firma}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Bilgisayar Adı</label>
                  <input className="form-input" value={compForm.name} onChange={e => setCompForm({...compForm, name: e.target.value})} placeholder="Ör: CAD-WS-01" />
                </div>
                <div className="form-group">
                  <label className="form-label">Host / IP Adresi</label>
                  <input className="form-input" value={compForm.host} onChange={e => setCompForm({...compForm, host: e.target.value})} placeholder="10.0.0.51" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bağlı Olduğu Firma / Tesis</label>
                <select className="form-select" value={compForm.company} onChange={e => setCompForm({...compForm, company: e.target.value})}>
                  {firmsList.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* WMI Auth Grid */}
              <div style={{ padding: '20px', background: 'var(--bg-inset)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                 <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>WMI Erişim Bilgileri</p>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Kullanıcı Adı</label>
                      <input className="form-input" value={compForm.username} onChange={e => setCompForm({...compForm, username: e.target.value})} placeholder="DOMAIN\User" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Şifre</label>
                      <input className="form-input" type="password" value={compForm.password} onChange={e => setCompForm({...compForm, password: e.target.value})} placeholder="••••••••" />
                    </div>
                 </div>
              </div>

              {/* Monitoring Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
                    <input type="checkbox" checked={compForm.enableUserActivity} onChange={e => setCompForm({...compForm, enableUserActivity: e.target.checked})} />
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Kullanıcı Aktivite İzleme</span>
                  </label>
                  <div className="form-group">
                    <label className="form-label">İzleme Grubu</label>
                    <input className="form-input" value={compForm.userActivityGroup} onChange={e => setCompForm({...compForm, userActivityGroup: e.target.value})} placeholder="Grup İsmi" disabled={!compForm.enableUserActivity} />
                  </div>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
                    <input type="checkbox" checked={compForm.enableFileMonitoring} onChange={e => setCompForm({...compForm, enableFileMonitoring: e.target.checked})} />
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Dosya Hareket İzleme</span>
                  </label>
                  <div className="form-group">
                    <label className="form-label">Eşik Değeri (MB)</label>
                    <input type="number" className="form-input" value={compForm.fileThresholdMb} onChange={e => setCompForm({...compForm, fileThresholdMb: parseInt(e.target.value) || 0})} disabled={!compForm.enableFileMonitoring} />
                  </div>
                </div>
              </div>

              {compForm.enableFileMonitoring && (
                <div style={{ padding: '20px', background: 'var(--red-light)', borderRadius: '12px', border: '1px solid var(--red-border)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '16px' }}>Gelişmiş Dosya İzleme Parametreleri</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">İzlenecek Klasörler (Noktalı virgül ile ayırın)</label>
                      <input className="form-input" value={compForm.monitoredPaths} onChange={e => setCompForm({...compForm, monitoredPaths: e.target.value})} placeholder="C:\Users;D:\Projeler" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Uzantılar</label>
                      <input className="form-input" value={compForm.monitoredExtensions} onChange={e => setCompForm({...compForm, monitoredExtensions: e.target.value})} placeholder="sldprt;dwg;zip" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setCompModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSaveComp}>Bilgisayarı Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {compDeleteModal && (
        <div className="modal-overlay" onClick={() => setCompDeleteModal(false)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Trash2 size={18} color="var(--red)" /> Kayıt Silinecek</h2>
              <button className="icon-btn" onClick={() => setCompDeleteModal(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '8px 0 24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>Bu bilgisayarı izleme listesinden çıkarmak istediğinize emin misiniz?</p>
              <p style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 600, marginTop: '8px' }}>Cihaza ait tüm geçmiş aktivite verileri sistemde korunacak ancak yeni veri akışı duracaktır.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setCompDeleteModal(false)}>İptal</button>
              <button className="btn btn-danger" style={{ background: 'var(--red)', color: '#fff' }} onClick={handleDeleteComp}>Evet, Listeden Çıkar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
